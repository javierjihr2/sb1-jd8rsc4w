import { doc, setDoc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { analyticsManager } from './analytics';
import { safeGetDoc, safeSetDoc, safeAddDoc, handleFirestoreError, diagnoseFirestoreIssues } from './firestore-utils';

// Tipos para el sistema de monetización
export interface MonetizationConfig {
  ownerAccountId: string;
  stripeAccountId: string;
  paypalAccountId?: string;
  bankAccountInfo?: {
    accountNumber: string;
    routingNumber: string;
    bankName: string;
  };
  taxInfo?: {
    taxId: string;
    businessName: string;
    address: string;
  };
  commissionRate: number; // Porcentaje que se queda la plataforma (ej: 0.03 = 3%)
  minimumPayout: number; // Mínimo para retirar fondos
}

export interface PaymentFlow {
  id: string;
  type: 'subscription' | 'sponsorship' | 'tournament_entry' | 'premium_content';
  amount: number;
  currency: string;
  fromUserId: string;
  toUserId?: string; // Para pagos directos entre usuarios
  platformFee: number;
  ownerShare: number;
  creatorShare?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'stripe' | 'paypal' | 'apple_pay' | 'google_pay';
  transactionId: string;
  createdAt: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

export interface SponsorshipDeal {
  id: string;
  sponsorId: string;
  creatorId: string;
  campaignName: string;
  amount: number;
  currency: string;
  duration: number; // días
  requirements: string[];
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  startDate: Date;
  endDate: Date;
  paymentSchedule: 'upfront' | 'milestone' | 'completion';
  deliverables: {
    description: string;
    completed: boolean;
    dueDate: Date;
  }[];
}

export interface RevenueReport {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  subscriptionRevenue: number;
  sponsorshipRevenue: number;
  tournamentRevenue: number;
  platformFees: number;
  ownerEarnings: number;
  creatorPayouts: number;
  activeSubscriptions: number;
  newSubscriptions: number;
  churnRate: number;
  topCreators: {
    userId: string;
    username: string;
    earnings: number;
  }[];
}

class MonetizationService {
  private config: MonetizationConfig | null = null;

  constructor() {
    this.initializeService();
  }
  
  // Inicialización mejorada del servicio
  private async initializeService(): Promise<void> {
    try {
      console.log('🚀 Initializing monetization service...');
      await this.loadConfiguration();
      
      if (this.config) {
        console.log('✅ Monetization service initialized successfully');
      } else {
        console.warn('⚠️ Monetization service initialized with fallback config');
      }
    } catch (error) {
      console.error('❌ Failed to initialize monetization service:', error);
    }
  }
  
  // Verificar salud del servicio
  public async checkServiceHealth(): Promise<{
    isHealthy: boolean;
    configLoaded: boolean;
    lastError?: string;
  }> {
    try {
      const isConfigValid = this.config && 
        typeof this.config === 'object' && 
        this.config.ownerAccountId !== 'fallback_account';
      
      // Intentar una operación de lectura simple
      const configRef = doc(db, 'app_config', 'monetization');
      await safeGetDoc(configRef, 'health check');
      
      return {
        isHealthy: true,
        configLoaded: !!isConfigValid
      };
    } catch (error: any) {
      return {
        isHealthy: false,
        configLoaded: !!this.config,
        lastError: error?.message || 'Unknown error'
      };
    }
  }

  // Cargar configuración de monetización
  private async loadConfiguration(): Promise<void> {
    try {
      const configRef = doc(db, 'app_config', 'monetization');
      const configDoc = await safeGetDoc(configRef, 'monetization config');
      
      if (configDoc.exists()) {
        const configData = configDoc.data();
        // Validar que configData existe y es un objeto
        if (!configData || typeof configData !== 'object') {
          console.warn('⚠️ Invalid monetization config data structure');
          throw new Error('Invalid monetization config data');
        }
        
        // Validar propiedades requeridas
        const requiredFields = ['ownerAccountId', 'stripeAccountId', 'commissionRate', 'minimumPayout'];
        const missingFields = requiredFields.filter(field => !(field in configData));
        
        if (missingFields.length > 0) {
          console.warn('⚠️ Missing required fields in monetization config:', missingFields);
        }
        
        // Sanitizar y validar tipos
        this.config = {
          ownerAccountId: typeof configData.ownerAccountId === 'string' ? configData.ownerAccountId : 'fallback_account',
          stripeAccountId: typeof configData.stripeAccountId === 'string' ? configData.stripeAccountId : 'fallback_stripe',
          commissionRate: typeof configData.commissionRate === 'number' && configData.commissionRate >= 0 && configData.commissionRate <= 1 
            ? configData.commissionRate : 0.03,
          minimumPayout: typeof configData.minimumPayout === 'number' && configData.minimumPayout > 0 
            ? configData.minimumPayout : 50.00
        };
        console.log('✅ Configuración de monetización cargada y validada exitosamente');
      } else {
        // Crear configuración por defecto
        const defaultConfig: MonetizationConfig = {
          ownerAccountId: 'owner_stripe_account_id', // CAMBIAR por tu ID real
          stripeAccountId: 'acct_your_stripe_account', // CAMBIAR por tu cuenta Stripe
          commissionRate: 0.03, // 3% de comisión de plataforma
          minimumPayout: 50.00 // Mínimo $50 para retirar
        };
        
        await safeSetDoc(configRef, defaultConfig, undefined, 'monetization config initialization');
        this.config = defaultConfig;
        console.log('✅ Configuración de monetización por defecto creada');
      }
    } catch (error) {
      try {
        const errorInfo = handleFirestoreError(error, 'loadConfiguration');
        console.error('❌ Error loading monetization config:', errorInfo);
        
        // Ejecutar diagnóstico para entender mejor el problema
        await diagnoseFirestoreIssues('monetization config load');
        
      } catch (importError) {
        console.error('❌ Error loading monetization config:', error);
      }
      
      // Usar configuración de respaldo en caso de error
      console.warn('⚠️ Using fallback monetization configuration due to load error');
      this.config = {
        ownerAccountId: 'fallback_account',
        stripeAccountId: 'fallback_stripe',
        commissionRate: 0.03,
        minimumPayout: 50.00
      };
      
      // Intentar recargar la configuración después de un tiempo
      setTimeout(() => {
        console.log('🔄 Attempting to reload monetization config...');
        this.loadConfiguration().catch(retryError => {
          console.warn('⚠️ Retry failed, continuing with fallback config:', retryError);
        });
      }, 30000); // Reintentar después de 30 segundos
    }
  }

  // Procesar pago de suscripción
  async processSubscriptionPayment(
    userId: string,
    planId: string,
    amount: number,
    paymentMethodId: string
  ): Promise<PaymentFlow | null> {
    try {
      if (!this.config || typeof this.config !== 'object') {
        console.warn('⚠️ Monetization config not loaded, using fallback');
        await this.loadConfiguration();
        if (!this.config) {
          throw new Error('Monetization config not loaded');
        }
      }

      const platformFee = amount * this.config.commissionRate;
      const ownerShare = amount - platformFee;

      const paymentFlow: PaymentFlow = {
        id: `sub_${Date.now()}_${userId}`,
        type: 'subscription',
        amount,
        currency: 'USD',
        fromUserId: userId,
        platformFee,
        ownerShare,
        status: 'pending',
        paymentMethod: 'stripe',
        transactionId: `txn_${Date.now()}`,
        createdAt: new Date(),
        metadata: {
          planId,
          paymentMethodId
        }
      };

      // Guardar en Firestore
      const paymentsRef = collection(db, 'payment_flows');
      await safeAddDoc(paymentsRef, paymentFlow, 'payment flow creation');

      // Simular procesamiento con Stripe
      const stripeResult = await this.processStripePayment(paymentFlow);
      
      if (stripeResult.success) {
        paymentFlow.status = 'completed';
        paymentFlow.completedAt = new Date();
        paymentFlow.transactionId = stripeResult.transactionId;
        
        // Transferir fondos al propietario
        await this.transferToOwner(ownerShare, paymentFlow.id);
        
        // Registrar analytics
        analyticsManager.trackEvent('subscription_payment_completed', {
          userId,
          planId,
          amount,
          ownerShare,
          platformFee
        });
      } else {
        paymentFlow.status = 'failed';
      }

      return paymentFlow;
    } catch (error) {
      console.error('Error processing subscription payment:', error);
      return null;
    }
  }

  // Procesar pago de patrocinio
  async processSponsorshipPayment(
    sponsorId: string,
    creatorId: string,
    amount: number,
    campaignId: string
  ): Promise<PaymentFlow | null> {
    try {
      if (!this.config) {
        throw new Error('Monetization config not loaded');
      }

      const platformFee = amount * this.config.commissionRate;
      const creatorShare = amount * 0.85; // 85% para el creador
      const ownerShare = amount - platformFee - creatorShare;

      const paymentFlow: PaymentFlow = {
        id: `spon_${Date.now()}_${sponsorId}`,
        type: 'sponsorship',
        amount,
        currency: 'USD',
        fromUserId: sponsorId,
        toUserId: creatorId,
        platformFee,
        ownerShare,
        creatorShare,
        status: 'pending',
        paymentMethod: 'stripe',
        transactionId: `txn_${Date.now()}`,
        createdAt: new Date(),
        metadata: {
          campaignId
        }
      };

      // Guardar en Firestore
      const paymentsRef = collection(db, 'payment_flows');
      await addDoc(paymentsRef, paymentFlow);

      // Procesar pago
      const stripeResult = await this.processStripePayment(paymentFlow);
      
      if (stripeResult.success) {
        paymentFlow.status = 'completed';
        paymentFlow.completedAt = new Date();
        
        // Transferir fondos
        await this.transferToOwner(ownerShare, paymentFlow.id);
        await this.transferToCreator(creatorId, creatorShare, paymentFlow.id);
        
        analyticsManager.trackEvent('sponsorship_payment_completed', {
          sponsorId,
          creatorId,
          amount,
          creatorShare,
          ownerShare
        });
      }

      return paymentFlow;
    } catch (error) {
      console.error('Error processing sponsorship payment:', error);
      return null;
    }
  }

  // Simular procesamiento con Stripe
  private async processStripePayment(paymentFlow: PaymentFlow): Promise<{
    success: boolean;
    transactionId: string;
    error?: string;
  }> {
    try {
      // AQUÍ IRÍA LA INTEGRACIÓN REAL CON STRIPE
      // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      // 
      // const paymentIntent = await stripe.paymentIntents.create({
      //   amount: Math.round(paymentFlow.amount * 100), // Stripe usa centavos
      //   currency: paymentFlow.currency.toLowerCase(),
      //   transfer_data: {
      //     destination: this.config.stripeAccountId,
      //   },
      //   metadata: {
      //     paymentFlowId: paymentFlow.id,
      //     type: paymentFlow.type
      //   }
      // });
      
      // Simulación para desarrollo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        success: true,
        transactionId: `stripe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    } catch (error) {
      console.error('Stripe payment error:', error);
      return {
        success: false,
        transactionId: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Transferir fondos al propietario de la app
  private async transferToOwner(amount: number, paymentFlowId: string): Promise<void> {
    try {
      if (!this.config) return;

      // AQUÍ IRÍA LA TRANSFERENCIA REAL A TU CUENTA
      // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      // 
      // await stripe.transfers.create({
      //   amount: Math.round(amount * 100),
      //   currency: 'usd',
      //   destination: this.config.ownerAccountId,
      //   metadata: {
      //     paymentFlowId,
      //     type: 'owner_share'
      //   }
      // });

      // Registrar transferencia en base de datos
      const transferRef = collection(db, 'owner_transfers');
      await addDoc(transferRef, {
        amount,
        paymentFlowId,
        accountId: this.config.ownerAccountId,
        status: 'completed',
        createdAt: new Date(),
        type: 'owner_share'
      });

      console.log(`✅ Transferred $${amount} to owner account: ${this.config.ownerAccountId}`);
    } catch (error) {
      console.error('Error transferring to owner:', error);
    }
  }

  // Transferir fondos a creador
  private async transferToCreator(creatorId: string, amount: number, paymentFlowId: string): Promise<void> {
    try {
      // Obtener información de pago del creador
      const creatorRef = doc(db, 'creator_payments', creatorId);
      const creatorDoc = await getDoc(creatorRef);
      
      if (!creatorDoc.exists()) {
        throw new Error('Creator payment info not found');
      }

      const creatorPaymentInfo = creatorDoc.data();

      // AQUÍ IRÍA LA TRANSFERENCIA REAL AL CREADOR
      // await stripe.transfers.create({
      //   amount: Math.round(amount * 100),
      //   currency: 'usd',
      //   destination: creatorPaymentInfo.stripeAccountId,
      //   metadata: {
      //     paymentFlowId,
      //     creatorId,
      //     type: 'creator_share'
      //   }
      // });

      // Registrar en base de datos
      const transferRef = collection(db, 'creator_transfers');
      await addDoc(transferRef, {
        creatorId,
        amount,
        paymentFlowId,
        accountId: creatorPaymentInfo.stripeAccountId,
        status: 'completed',
        createdAt: new Date(),
        type: 'creator_share'
      });

      console.log(`✅ Transferred $${amount} to creator: ${creatorId}`);
    } catch (error) {
      console.error('Error transferring to creator:', error);
    }
  }

  // Generar reporte de ingresos
  async generateRevenueReport(
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    startDate: Date,
    endDate: Date
  ): Promise<RevenueReport> {
    try {
      const paymentsRef = collection(db, 'payment_flows');
      const q = query(
        paymentsRef,
        where('status', '==', 'completed'),
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate)
      );
      
      const querySnapshot = await getDocs(q);
      const payments = querySnapshot.docs.map(doc => doc.data() as PaymentFlow);

      const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
      const subscriptionRevenue = payments
        .filter(p => p.type === 'subscription')
        .reduce((sum, p) => sum + p.amount, 0);
      const sponsorshipRevenue = payments
        .filter(p => p.type === 'sponsorship')
        .reduce((sum, p) => sum + p.amount, 0);
      const platformFees = payments.reduce((sum, p) => sum + p.platformFee, 0);
      const ownerEarnings = payments.reduce((sum, p) => sum + p.ownerShare, 0);
      const creatorPayouts = payments.reduce((sum, p) => sum + (p.creatorShare || 0), 0);

      const report: RevenueReport = {
        period,
        startDate,
        endDate,
        totalRevenue,
        subscriptionRevenue,
        sponsorshipRevenue,
        tournamentRevenue: 0, // Implementar si es necesario
        platformFees,
        ownerEarnings,
        creatorPayouts,
        activeSubscriptions: 0, // Calcular desde suscripciones activas
        newSubscriptions: payments.filter(p => p.type === 'subscription').length,
        churnRate: 0, // Calcular tasa de cancelación
        topCreators: [] // Implementar ranking de creadores
      };

      return report;
    } catch (error) {
      console.error('Error generating revenue report:', error);
      throw error;
    }
  }

  // Configurar cuenta de pago para creador
  async setupCreatorPayments(creatorId: string, paymentInfo: {
    stripeAccountId?: string;
    paypalEmail?: string;
    bankAccount?: {
      accountNumber: string;
      routingNumber: string;
      accountHolderName: string;
    };
  }): Promise<boolean> {
    try {
      const creatorRef = doc(db, 'creator_payments', creatorId);
      await setDoc(creatorRef, {
        ...paymentInfo,
        setupDate: new Date(),
        verified: false, // Requiere verificación manual
        minimumPayout: this.config?.minimumPayout || 50
      });

      return true;
    } catch (error) {
      console.error('Error setting up creator payments:', error);
      return false;
    }
  }

  // Obtener configuración actual
  getConfig(): MonetizationConfig | null {
    return this.config;
  }

  // Actualizar configuración
  async updateConfig(newConfig: Partial<MonetizationConfig>): Promise<boolean> {
    try {
      if (!this.config) return false;

      const updatedConfig = { ...this.config, ...newConfig };
      const configRef = doc(db, 'app_config', 'monetization');
      await updateDoc(configRef, updatedConfig);
      
      this.config = updatedConfig;
      return true;
    } catch (error) {
      try {
        const { handleFirestoreError } = await import('./firestore-utils');
        const errorInfo = handleFirestoreError(error, 'updateMonetizationConfig');
        console.error('❌ Error updating monetization config:', errorInfo);
      } catch (importError) {
        console.error('❌ Error updating monetization config:', error);
      }
      return false;
    }
  }
}

// Instancia singleton
export const monetizationService = new MonetizationService();

// Funciones de utilidad
export const processSubscription = (userId: string, planId: string, amount: number, paymentMethodId: string) => 
  monetizationService.processSubscriptionPayment(userId, planId, amount, paymentMethodId);

export const processSponsorship = (sponsorId: string, creatorId: string, amount: number, campaignId: string) => 
  monetizationService.processSponsorshipPayment(sponsorId, creatorId, amount, campaignId);

export const checkMonetizationHealth = () => 
  monetizationService.checkServiceHealth();

export const getMonetizationConfig = () => 
  monetizationService.getConfig();

export const generateReport = (period: RevenueReport['period'], startDate: Date, endDate: Date) => 
  monetizationService.generateRevenueReport(period, startDate, endDate);

export const setupCreatorPayments = (creatorId: string, paymentInfo: any) => 
  monetizationService.setupCreatorPayments(creatorId, paymentInfo);

// Documentación del flujo de monetización
export const MONETIZATION_FLOW_DOCS = {
  overview: `
    FLUJO DE MONETIZACIÓN SQUADGO
    ============================
    
    1. SUSCRIPCIONES ($4.99/mes):
       - Usuario paga $4.99
       - Plataforma retiene 3% ($0.15)
       - Propietario recibe $4.84
       - Fondos se transfieren automáticamente a tu cuenta Stripe
    
    2. PATROCINIOS:
       - Patrocinador paga cantidad acordada
       - Plataforma retiene 3%
       - Creador recibe 85%
       - Propietario recibe 12% + comisión
    
    3. CONFIGURACIÓN REQUERIDA:
       - Cuenta Stripe Connect configurada
       - ID de cuenta Stripe del propietario
       - Configuración de webhooks para confirmaciones
    
    4. TRANSFERENCIAS:
       - Automáticas cada 24-48 horas
       - Mínimo de $50 para transferir
       - Todos los fondos van directamente a tu cuenta
  `,
  
  setup: `
    CONFIGURACIÓN INICIAL
    ====================
    
    1. Crear cuenta Stripe:
       - Ir a stripe.com
       - Crear cuenta business
       - Completar verificación KYC
    
    2. Configurar Stripe Connect:
       - Habilitar Stripe Connect en dashboard
       - Configurar webhooks
       - Obtener claves API
    
    3. Actualizar configuración:
       - Cambiar 'owner_stripe_account_id' por tu ID real
       - Configurar webhooks en Firebase Functions
       - Probar en modo sandbox
  `,
  
  security: `
    SEGURIDAD Y CUMPLIMIENTO
    =======================
    
    1. PCI Compliance:
       - Stripe maneja todos los datos de tarjetas
       - No almacenamos información sensible
       - Tokens seguros para pagos recurrentes
    
    2. Auditoría:
       - Todos los pagos registrados en Firestore
       - Logs detallados de transferencias
       - Reportes automáticos de ingresos
    
    3. Disputas:
       - Stripe maneja chargebacks automáticamente
       - Notificaciones en tiempo real
       - Proceso de resolución integrado
  `
};