import * as React from 'react';
import { Suspense } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

// Interfaces para props
interface ComponentProps {
  [key: string]: any;
}

interface LazyComponentProps extends ComponentProps {
  children?: React.ReactNode;
}

// Props genéricas compatibles con todos los componentes
type GenericComponentProps = any;

// Fallback component para componentes pesados
const HeavyComponentFallback = () => (
  <View style={{ 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    minHeight: 200,
    backgroundColor: '#f5f5f5'
  }}>
    <ActivityIndicator size="large" color="#007AFF" />
    <Text style={{ marginTop: 10, color: '#666' }}>Cargando componente...</Text>
  </View>
);

// Fallback para componentes de video
const VideoComponentFallback = () => (
  <View style={{ 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    minHeight: 300,
    backgroundColor: '#000'
  }}>
    <ActivityIndicator size="large" color="#fff" />
    <Text style={{ marginTop: 10, color: '#fff' }}>Cargando video...</Text>
  </View>
);

// Fallback para componentes de feed
const FeedComponentFallback = () => (
  <View style={{ 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    minHeight: 150,
    backgroundColor: '#fafafa'
  }}>
    <ActivityIndicator size="large" color="#007AFF" />
    <Text style={{ marginTop: 8, color: '#888', fontSize: 14 }}>Cargando contenido...</Text>
  </View>
);

// Lazy Components usando React.lazy

// Componente de Reels (muy pesado por video)
const ReelsComponentLazy = React.lazy(() => import('./modern/ReelsComponent'));
export const LazyReelsComponent = (props: GenericComponentProps) => (
  <Suspense fallback={<HeavyComponentFallback />}>
    <ReelsComponentLazy {...props} />
  </Suspense>
);

// Componente de Feed moderno (pesado por animaciones)
const ModernFeedComponentLazy = React.lazy(() => import('./modern/ModernFeedComponent'));
export const LazyModernFeedComponent = (props: GenericComponentProps) => (
  <Suspense fallback={<FeedComponentFallback />}>
    <ModernFeedComponentLazy {...props} />
  </Suspense>
);

// Componente de Live Stream (muy pesado)
const LiveStreamComponentLazy = React.lazy(() => import('./modern/LiveStreamComponent'));
export const LazyLiveStreamComponent = (props: GenericComponentProps) => (
  <Suspense fallback={<VideoComponentFallback />}>
    <LiveStreamComponentLazy {...props} />
  </Suspense>
);

// Componente de UI Demo (pesado por animaciones)
const ModernUIDemoLazy = React.lazy(() => import('./demo/ModernUIDemo'));
export const LazyModernUIDemo = (props: GenericComponentProps) => (
  <Suspense fallback={<HeavyComponentFallback />}>
    <ModernUIDemoLazy {...props} />
  </Suspense>
);

// Componente de Visual Hierarchy (pesado por efectos)
const VisualHierarchyLazy = React.lazy(() => import('./ui/VisualHierarchy').then(module => ({ default: module.default.GradientHeader })));
export const LazyVisualHierarchy = (props: GenericComponentProps) => (
  <Suspense fallback={<HeavyComponentFallback />}>
    <VisualHierarchyLazy {...props} />
  </Suspense>
);

// Componente de Micro Interactions (pesado por animaciones)
const MicroInteractionsLazy = React.lazy(() => import('./ui/MicroInteractions'));
export const LazyMicroInteractions = (props: GenericComponentProps) => (
  <Suspense fallback={<HeavyComponentFallback />}>
    <MicroInteractionsLazy {...props} />
  </Suspense>
);

// Componente de Floating Elements (disponible)
const FloatingElementsLazy = React.lazy(() => import('./ui/FloatingElements').then(module => ({ default: module.FloatingActionMenu })));
export const LazyFloatingElements = (props: GenericComponentProps) => (
  <Suspense fallback={<HeavyComponentFallback />}>
    <FloatingElementsLazy {...props} />
  </Suspense>
);

// Componente de Ad System (pesado por lógica)
const AdSystemLazy = React.lazy(() => import('./AdSystem'));
export const LazyAdSystem = (props: GenericComponentProps) => (
  <Suspense fallback={<HeavyComponentFallback />}>
    <AdSystemLazy {...props} />
  </Suspense>
);

// Componente de Message Reactions (disponible)
const MessageReactionsLazy = React.lazy(() => import('./chat/MessageReactions'));
export const LazyMessageReactions = (props: GenericComponentProps) => (
  <Suspense fallback={<FeedComponentFallback />}>
    <MessageReactionsLazy {...props} />
  </Suspense>
);

// Componente de Stories (pesado por video/imágenes)
const StoriesComponentLazy = React.lazy(() => import('./modern/StoriesComponent'));
export const LazyStoriesComponent = (props: GenericComponentProps) => (
  <Suspense fallback={<VideoComponentFallback />}>
    <StoriesComponentLazy {...props} />
  </Suspense>
);

// Componente de Modern Navigation (disponible)
const ModernNavigationLazy = React.lazy(() => import('./ui/ModernNavigation'));
export const LazyModernNavigation = (props: GenericComponentProps) => (
  <Suspense fallback={<HeavyComponentFallback />}>
    <ModernNavigationLazy {...props} />
  </Suspense>
);

// Componente de Typing Indicator (disponible)
const TypingIndicatorLazy = React.lazy(() => import('./chat/TypingIndicator'));
export const LazyTypingIndicator = (props: GenericComponentProps) => (
  <Suspense fallback={<FeedComponentFallback />}>
    <TypingIndicatorLazy {...props} />
  </Suspense>
);

// Componente de AI Recommendations (disponible)
const AIRecommendationsLazy = React.lazy(() => import('./modern/AIRecommendations'));
export const LazyAIRecommendations = (props: GenericComponentProps) => (
  <Suspense fallback={<HeavyComponentFallback />}>
    <AIRecommendationsLazy {...props} />
  </Suspense>
);

// Componente de Advanced Messaging (disponible)
const AdvancedMessagingLazy = React.lazy(() => import('./modern/AdvancedMessaging'));
export const LazyAdvancedMessaging = (props: GenericComponentProps) => (
  <Suspense fallback={<FeedComponentFallback />}>
    <AdvancedMessagingLazy {...props} />
  </Suspense>
);

// Componente de Advanced Profile (disponible)
const AdvancedProfileLazy = React.lazy(() => import('./modern/AdvancedProfile'));
export const LazyAdvancedProfile = (props: GenericComponentProps) => (
  <Suspense fallback={<HeavyComponentFallback />}>
    <AdvancedProfileLazy {...props} />
  </Suspense>
);

// Componente de Premium Marketplace (disponible)
const PremiumMarketplaceLazy = React.lazy(() => import('./modern/PremiumMarketplace'));
export const LazyPremiumMarketplace = (props: GenericComponentProps) => (
  <Suspense fallback={<HeavyComponentFallback />}>
    <PremiumMarketplaceLazy {...props} />
  </Suspense>
);

// Componente de Gaming Integration (disponible)
const GamingIntegrationLazy = React.lazy(() => import('./modern/GamingIntegration'));
export const LazyGamingIntegration = (props: GenericComponentProps) => (
  <Suspense fallback={<VideoComponentFallback />}>
    <GamingIntegrationLazy {...props} />
  </Suspense>
);

// Componente de Content Creation Tools (disponible)
const ContentCreationToolsLazy = React.lazy(() => import('./modern/ContentCreationTools'));
export const LazyContentCreationTools = (props: GenericComponentProps) => (
  <Suspense fallback={<HeavyComponentFallback />}>
    <ContentCreationToolsLazy {...props} />
  </Suspense>
);

// Exportar todos los componentes lazy
export const LazyComponents = {
  ReelsComponent: LazyReelsComponent,
  ModernFeedComponent: LazyModernFeedComponent,
  LiveStreamComponent: LazyLiveStreamComponent,
  ModernUIDemo: LazyModernUIDemo,
  VisualHierarchy: LazyVisualHierarchy,
  MicroInteractions: LazyMicroInteractions,
  FloatingElements: LazyFloatingElements,
  AdSystem: LazyAdSystem,
  MessageReactions: LazyMessageReactions,
  StoriesComponent: LazyStoriesComponent,
  AdvancedProfile: LazyAdvancedProfile,
  ModernNavigation: LazyModernNavigation,
  TypingIndicator: LazyTypingIndicator,
  AIRecommendations: LazyAIRecommendations,
  AdvancedMessaging: LazyAdvancedMessaging,
  PremiumMarketplace: LazyPremiumMarketplace,
  GamingIntegration: LazyGamingIntegration,
  ContentCreationTools: LazyContentCreationTools,
};

export default LazyComponents;