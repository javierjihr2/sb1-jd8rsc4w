'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  UserPlus,
  Users,
  UserCheck,
  UserX,
  Search,
  MessageCircle,
  MoreVertical,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getUserFriends,
  getPendingFriendRequests,
  searchUsers,
  subscribeToFriendRequests,
  subscribeToFriends,
  cleanupFriendListeners,
  type FriendRequest,
  type FriendProfile
} from '@/lib/friend-system';

export default function FriendsPage() {
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<FriendProfile | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock current user - replace with actual user data
  const currentUser = {
    id: 'current-user-id',
    username: 'current-user'
  };

  useEffect(() => {
    loadInitialData();
    setupRealtimeListeners();

    return () => {
      cleanupFriendListeners(currentUser.id);
    };
  }, []);

  const loadInitialData = async () => {
    try {
      const [friendsResult, requestsResult] = await Promise.all([
        getUserFriends(currentUser.id),
        getPendingFriendRequests(currentUser.id)
      ]);

      if (friendsResult.success && friendsResult.friends) {
        setFriends(friendsResult.friends);
      }

      if (requestsResult.success && requestsResult.requests) {
        setFriendRequests(requestsResult.requests);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Error al cargar datos de amigos');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeListeners = () => {
    // Subscribe to friend requests
    subscribeToFriendRequests(currentUser.id, (requests) => {
      setFriendRequests(requests);
    });

    // Subscribe to friends list
    subscribeToFriends(currentUser.id, (friendsList) => {
      setFriends(friendsList);
    });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchUsers(searchQuery, currentUser.id);
      if (result.success && result.users) {
        setSearchResults(result.users);
      } else {
        toast.error(result.error || 'Error al buscar usuarios');
      }
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Error al buscar usuarios');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!selectedUser) return;

    try {
      const result = await sendFriendRequest(
        currentUser.id,
        selectedUser.userId,
        currentUser.username,
        selectedUser.username,
        requestMessage
      );

      if (result.success) {
        toast.success('Solicitud de amistad enviada');
        setIsDialogOpen(false);
        setSelectedUser(null);
        setRequestMessage('');
        // Remove user from search results
        setSearchResults(prev => prev.filter(u => u.userId !== selectedUser.userId));
      } else {
        toast.error(result.error || 'Error al enviar solicitud');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Error al enviar solicitud de amistad');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const result = await acceptFriendRequest(requestId, currentUser.id);
      if (result.success) {
        toast.success('Solicitud de amistad aceptada');
      } else {
        toast.error(result.error || 'Error al aceptar solicitud');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error('Error al aceptar solicitud');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const result = await rejectFriendRequest(requestId, currentUser.id);
      if (result.success) {
        toast.success('Solicitud de amistad rechazada');
      } else {
        toast.error(result.error || 'Error al rechazar solicitud');
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      toast.error('Error al rechazar solicitud');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      const result = await removeFriend(currentUser.id, friendId);
      if (result.success) {
        toast.success('Amigo eliminado');
      } else {
        toast.error(result.error || 'Error al eliminar amigo');
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      toast.error('Error al eliminar amigo');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando amigos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Amigos</h1>
        <p className="text-muted-foreground">
          Gestiona tus amigos y solicitudes de amistad
        </p>
      </div>

      <Tabs defaultValue="friends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Amigos ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Solicitudes ({friendRequests.length})
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Buscar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mis Amigos</CardTitle>
              <CardDescription>
                Lista de todos tus amigos conectados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {friends.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Aún no tienes amigos. ¡Busca usuarios para agregar!
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {friends.map((friend) => (
                      <div
                        key={friend.userId}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar>
                              <AvatarImage src={friend.avatar} />
                              <AvatarFallback>
                                {friend.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(friend.status)}`} />
                          </div>
                          <div>
                            <p className="font-medium">{friend.displayName || friend.username}</p>
                            <p className="text-sm text-muted-foreground">@{friend.username}</p>
                            <Badge variant="outline" className="text-xs">
                              {friend.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => handleRemoveFriend(friend.userId)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar amigo
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes de Amistad</CardTitle>
              <CardDescription>
                Solicitudes pendientes de otros usuarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              {friendRequests.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No tienes solicitudes de amistad pendientes
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {friendRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {request.fromUsername.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">@{request.fromUsername}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                            {request.message && (
                              <p className="text-sm mt-1 p-2 bg-muted rounded">
                                "{request.message}"
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptRequest(request.id!)}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Aceptar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectRequest(request.id!)}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Rechazar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Buscar Usuarios</CardTitle>
              <CardDescription>
                Encuentra nuevos amigos para agregar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar por nombre de usuario..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isSearching}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {searchResults.length > 0 && (
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {searchResults.map((user) => (
                      <div
                        key={user.userId}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>
                              {user.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.displayName || user.username}</p>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                            {user.mutualFriends && (
                              <p className="text-xs text-muted-foreground">
                                {user.mutualFriends} amigos en común
                              </p>
                            )}
                          </div>
                        </div>
                        <Dialog open={isDialogOpen && selectedUser?.userId === user.userId} onOpenChange={setIsDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Agregar
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Enviar Solicitud de Amistad</DialogTitle>
                              <DialogDescription>
                                Enviar solicitud de amistad a @{user.username}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Textarea
                                placeholder="Mensaje opcional..."
                                value={requestMessage}
                                onChange={(e) => setRequestMessage(e.target.value)}
                                maxLength={500}
                              />
                              <p className="text-xs text-muted-foreground">
                                {requestMessage.length}/500 caracteres
                              </p>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancelar
                              </Button>
                              <Button onClick={handleSendFriendRequest}>
                                Enviar Solicitud
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {searchQuery && searchResults.length === 0 && !isSearching && (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No se encontraron usuarios con ese nombre
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}