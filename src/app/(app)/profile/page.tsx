

"use client"

import { useState } from "react"
import { Camera, Edit3, Trophy, Target, Calendar, MapPin, Users, Star, Bookmark, Settings, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/app/auth-provider"
import { useUserProfile, useUpdateProfile, useUploadAvatar, useUserStats, useUserAchievements } from "@/hooks/use-profile"
import { useUserStore } from "@/store"
import { FeedPost } from "@/components/feed-post"
import { usePosts } from "@/hooks/use-posts"

export default function ProfilePage() {
  const { user } = useAuth()
  const { user: currentUser } = useUserStore()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    location: '',
    pubgId: '',
    rank: '',
    favoriteWeapon: ''
  })

  const { profile, isLoading: profileLoading, error: profileError } = useUserProfile(user?.uid)
  const { data: stats } = useUserStats(user?.uid)
  const { data: achievements } = useUserAchievements(user?.uid)
  const { posts, isLoading: postsLoading } = usePosts()
  const updateProfileMutation = useUpdateProfile()
  const uploadAvatarMutation = useUploadAvatar()

  const handleEditProfile = () => {
    if (profile) {
      setEditForm({
        displayName: profile.displayName || '',
        bio: profile.bio || '',
        location: profile.location || '',
        pubgId: profile.pubgId || '',
        rank: profile.rank || '',
        favoriteWeapon: profile.favoriteWeapon || ''
      })
    }
    setIsEditDialogOpen(true)
  }

  const handleSaveProfile = async () => {
    if (!user?.uid) return
    
    try {
      await updateProfileMutation.mutateAsync(editForm)
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.uid) return

    try {
      await uploadAvatarMutation.mutateAsync(file)
    } catch (error) {
      console.error('Error uploading avatar:', error)
    }
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (profileError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-destructive">Error al cargar el perfil: {profileError}</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Profile not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.photoURL || ''} />
                <AvatarFallback>
                  {profile.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 p-1 bg-primary rounded-full cursor-pointer hover:bg-primary/80">
                <Camera className="h-4 w-4 text-primary-foreground" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploadAvatarMutation.isPending}
                />
              </label>
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">{profile.displayName || 'Anonymous Player'}</h1>
                  <p className="text-muted-foreground">{profile.bio || 'No bio available'}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    {profile.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {profile.location}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Joined {new Date(user?.metadata?.creationTime || '').toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <Button onClick={handleEditProfile} variant="outline">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats and Content */}
      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          {postsLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    {/* Post header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="h-10 w-10 bg-muted rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/3" />
                        <div className="h-3 bg-muted rounded w-1/4" />
                      </div>
                      <div className="h-6 w-6 bg-muted rounded" />
                    </div>
                    
                    {/* Post content */}
                    <div className="space-y-3 mb-4">
                      <div className="h-4 bg-muted rounded" />
                      <div className="h-4 bg-muted rounded w-4/5" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </div>
                    
                    {/* Post actions */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 bg-muted rounded" />
                          <div className="h-4 bg-muted rounded w-8" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 bg-muted rounded" />
                          <div className="h-4 bg-muted rounded w-8" />
                        </div>
                      </div>
                      <div className="h-5 w-5 bg-muted rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            posts.map((post) => (
              <FeedPost key={post.id} post={post} />
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No posts yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Rank</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile.rank || 'Unranked'}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">PUBG ID</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile.pubgId || 'Not set'}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Favorite Weapon</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile.favoriteWeapon || 'Not set'}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements && achievements.length > 0 ? (
              achievements.map((achievement) => (
                <Card key={achievement.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Trophy className="h-8 w-8 text-yellow-500" />
                      <div>
                        <h3 className="font-semibold">{achievement.title}</h3>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No achievements yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={editForm.displayName}
                onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={editForm.bio}
                onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
              />
            </div>
            
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={editForm.location}
                onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Your location"
              />
            </div>
            
            <div>
              <Label htmlFor="pubgId">PUBG ID</Label>
              <Input
                id="pubgId"
                value={editForm.pubgId}
                onChange={(e) => setEditForm(prev => ({ ...prev, pubgId: e.target.value }))}
                placeholder="Your PUBG player ID"
              />
            </div>
            
            <div>
              <Label htmlFor="rank">Rank</Label>
              <Select value={editForm.rank} onValueChange={(value) => setEditForm(prev => ({ ...prev, rank: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your rank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bronze">Bronze</SelectItem>
                  <SelectItem value="Silver">Silver</SelectItem>
                  <SelectItem value="Gold">Gold</SelectItem>
                  <SelectItem value="Platinum">Platinum</SelectItem>
                  <SelectItem value="Diamond">Diamond</SelectItem>
                  <SelectItem value="Crown">Crown</SelectItem>
                  <SelectItem value="Ace">Ace</SelectItem>
                  <SelectItem value="Conqueror">Conqueror</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="favoriteWeapon">Favorite Weapon</Label>
              <Input
                id="favoriteWeapon"
                value={editForm.favoriteWeapon}
                onChange={(e) => setEditForm(prev => ({ ...prev, favoriteWeapon: e.target.value }))}
                placeholder="Your favorite weapon"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
