import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  MapPin,
  Loader2,
  Edit2,
  X,
  Save,
  Camera,
  Upload
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function ProfileDialog({ isOpen, onClose }) {
  const { user, updateUserDetails, refreshUser, updateAvatar } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  // const [avatarPreview, setAvatarPreview] = useState(null); // Removed unused variable
  const fileInputRef = useRef(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isAvatarPreviewOpen, setIsAvatarPreviewOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
    position: user?.position || '',
    location: user?.location || '',
  });

  // Update formData when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        position: user.position || '',
        location: user.location || '',
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxBytes = 2 * 1024 * 1024; // 2 MB
    if (file.size > maxBytes) {
      toast.error('Image should be less or equal to 2 MB');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    try {
      setIsUploadingAvatar(true);
      // Upload avatar using context method
      if (typeof updateAvatar === 'function') {
        await updateAvatar(file);
        await refreshUser(); // Ensure user context is updated
        toast.success('Profile photo updated');
      } else {
        toast.error('Avatar update function not available');
      }
      setAvatarFile(null);
    } catch (error) {
      console.error('Failed to update avatar:', error);
      toast.error(error?.message || 'Failed to update photo');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // If there's an avatar file, upload it first
      if (avatarFile) {
        console.log('Uploading avatar file:', avatarFile.name);
        const formDataWithAvatar = new FormData();
        formDataWithAvatar.append('avatar', avatarFile);

        // Add other fields
        Object.keys(formData).forEach(key => {
          if (formData[key]) {
            formDataWithAvatar.append(key, formData[key]);
          }
        });

        // Upload with FormData
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/updatedetails`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
          body: formDataWithAvatar,
        });

        const data = await response.json();
        console.log('Update response:', data);

        if (!response.ok) {
          throw new Error(data.message || 'Failed to update profile');
        }

        console.log('Avatar in response:', data.data?.avatar);

        // Refresh user data from backend first to get new avatar URL
        console.log('Refreshing user data...');
        const refreshedData = await refreshUser();
        console.log('User refreshed, new avatar:', refreshedData?.data?.avatar);

        // Then clear preview and file states
        setAvatarFile(null);
  // setAvatarPreview(null); // Removed: avatarPreview is not defined

        toast.success('Profile updated successfully!');
        setIsEditing(false);
      } else {
        // No avatar file, use regular update
        await updateUserDetails(formData);
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      department: user?.department || '',
      position: user?.position || '',
      location: user?.location || '',
    });
    setAvatarFile(null);
  // setAvatarPreview(null); // Removed: avatarPreview is not defined
    setIsEditing(false);
  };

  if (!user) return null;

  const fullName = `${user.firstName} ${user.lastName}`;
  // Construct the full avatar URL - Cloudinary URLs are already full URLs
  // Add cache-busting parameter to force browser to fetch new image
  const userAvatar = user.avatar && user.avatar !== 'default-avatar.png'
    ? `${user.avatar}${user.avatar.includes('?') ? '&' : '?'}t=${user.updatedAt || Date.now()}` // Add timestamp to bust cache
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.firstName}`;

  const roleColors = {
    'admin': 'bg-red-100 text-red-800',
    'hr_recruiter': 'bg-purple-100 text-purple-800',
    'hr-manager': 'bg-purple-100 text-purple-800',
    'hr': 'bg-purple-100 text-purple-800',
    'manager': 'bg-blue-100 text-blue-800',
    'employee': 'bg-green-100 text-green-800',
  };

  const roleColor = roleColors[user.role?.toLowerCase()] || 'bg-gray-100 text-gray-800';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-lg sm:text-xl md:text-2xl">My Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
          {/* Profile Header */}
          <Card className="w-full max-w-full overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0">
                  <Avatar className="h-20 w-20 sm:h-24 sm:w-24 cursor-zoom-in" onClick={() => setIsAvatarPreviewOpen(true)}>
                    <AvatarImage src={userAvatar} alt={fullName} />
                    <AvatarFallback className="text-2xl">{user.firstName?.charAt(0)}{user.lastName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={handleAvatarClick}
                    title="Edit photo"
                    className="absolute bottom-1 right-1 z-10 inline-flex items-center justify-center p-0 m-0 bg-transparent hover:bg-transparent"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-700" />
                    ) : (
                      <Edit2 className="h-4 w-4 text-gray-700 hover:text-gray-900" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <div className="flex-1 text-center sm:text-left w-full min-w-0">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 break-words">
                    {fullName}
                  </h3>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <Badge className={`${roleColor} capitalize text-xs`}>
                      {user.role?.replace('_', ' ')}
                    </Badge>
                    {user.department && (
                      <Badge variant="outline" className="text-xs">
                        {user.department}
                      </Badge>
                    )}
                  </div>
                </div>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="shrink-0"
                  >
                    <Edit2 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Edit Profile</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card className="w-full max-w-full overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <h4 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Personal Information</h4>
              <div className="space-y-3 sm:space-y-4 w-full max-w-full overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-xs sm:text-sm">First Name</Label>
                    {isEditing ? (
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="mt-1 text-sm sm:text-base"
                      />
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-4 w-4 text-gray-400 shrink-0" />
                        <span className="text-sm sm:text-base break-words">{user.firstName}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-xs sm:text-sm">Last Name</Label>
                    {isEditing ? (
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="mt-1 text-sm sm:text-base"
                      />
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-4 w-4 text-gray-400 shrink-0" />
                        <span className="text-sm sm:text-base break-words">{user.lastName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-sm sm:text-base break-all">{user.email}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-xs sm:text-sm">Phone</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="mt-1 text-sm sm:text-base"
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="text-sm sm:text-base">{user.phone || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="position" className="text-xs sm:text-sm">Position</Label>
                  {isEditing ? (
                    <Input
                      id="position"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      className="mt-1 text-sm sm:text-base"
                      placeholder="Enter position"
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <Briefcase className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="text-sm sm:text-base break-words">{user.position || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="location" className="text-xs sm:text-sm">Location</Label>
                  {isEditing ? (
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="mt-1 text-sm sm:text-base"
                      placeholder="Enter location"
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="text-sm sm:text-base break-words">{user.location || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                {user.createdAt && (
                  <div>
                    <Label className="text-xs sm:text-sm">Member Since</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="text-sm sm:text-base">
                        {new Date(user.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 sm:pt-4 border-t">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="w-full sm:w-auto text-sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full sm:w-auto text-sm"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto text-sm"
              >
                Close
              </Button>
            )}
          </div>

        {/* Avatar Preview Dialog */}
        <Dialog open={isAvatarPreviewOpen} onOpenChange={setIsAvatarPreviewOpen}>
          <DialogContent className="max-w-3xl w-[95vw] p-6">
            <div className="w-full h-full flex items-center justify-center">
              <div className="rounded-full overflow-hidden w-[60vh] h-[60vh] max-w-[80vw] max-h-[80vh]">
                <img
                  src={userAvatar}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </DialogContent>
    </Dialog>
  );
}
