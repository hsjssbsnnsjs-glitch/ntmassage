import { AppLanguage } from '../types';

export interface Translations {
  // Common
  appName: string;
  cancel: string;
  delete: string;
  confirm: string;
  save: string;
  edit: string;
  loading: string;
  send: string;
  close: string;
  search: string;
  online: string;
  offline: string;
  back: string;
  done: string;
  error: string;
  success: string;
  you: string;
  publish: string;
  language: string;
  notifications: string;
  soundEffects: string;
  vibration: string;
  privacy: string;
  blockedUsers: string;
  changePassword: string;
  passwordChangedSuccess: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  backupAndData: string;
  exportChatHistory: string;
  clearCache: string;
  deleteAccount: string;
  deleteAccountConfirm: string;
  enablePushNotifications: string;
  writeCaption: string;
  passwordValidation: string;

  // Tabs
  chats: string;
  feed: string;
  posts: string;
  followers: string;
  following: string;

  // Direct List
  directTitle: string;
  searchUsersPlaceholder: string;
  noChatsYet: string;
  startChatting: string;
  noSearchResults: string;
  stories: string;
  yourStory: string;
  addStory: string;
  newPost: string;
  newStory: string;
  pinned: string;
  favorite: string;
  muted: string;
  pinChat: string;
  unpinChat: string;
  favChat: string;
  unfavChat: string;
  muteChat: string;
  unmuteChat: string;
  deleteChat: string;
  confirmDeleteChat: string;

  // Chat Screen
  typeMessagePlaceholder: string;
  recordingVoice: string;
  uploadingMedia: string;
  voiceCall: string;
  videoCall: string;
  replyTo: string;
  editMessage: string;
  deleteMessage: string;
  starMessage: string;
  unstarMessage: string;
  copyText: string;
  textCopied: string;
  mediaPhoto: string;
  mediaVideo: string;
  mediaVoice: string;
  holdToOptions: string;

  // Feed & Posts
  likes: string;
  comments: string;
  addCommentPlaceholder: string;
  postCaptionPlaceholder: string;
  writeCaptionPlaceholder: string;
  createPostTitle: string;
  publishPost: string;
  selectPhotoOrVideo: string;
  deletePostConfirm: string;
  editCaption: string;
  savePost: string;
  savedPosts: string;
  noPostsYet: string;
  noFeedPosts: string;
  sharePost: string;
  downloadMedia: string;
  downloadSuccess: string;
  cropAndRotate: string;

  // Stories
  storyReplyPlaceholder: string;
  deleteStoryConfirm: string;
  viewers: string;
  noViewersYet: string;
  storyViewersTitle: string;
  viewsCount: string;
  replySent: string;
  createStoryTitle: string;
  publishStory: string;
  storyRemainingTime: string;

  // Profile & Edit
  editProfile: string;
  bioPlaceholder: string;
  displayNameLabel: string;
  displayNamePlaceholder: string;
  usernameLabel: string;
  usernamePlaceholder: string;
  emailLabel: string;
  changeAvatar: string;
  follow: string;
  unfollow: string;
  closeFriend: string;
  addCloseFriend: string;
  removeCloseFriend: string;
  block: string;
  unblock: string;
  blockConfirm: string;
  unblockConfirm: string;
  blockedUsersTitle: string;
  noBlockedUsers: string;

  // Settings
  settingsTitle: string;
  appearanceSection: string;
  darkModeTitle: string;
  darkModeDesc: string;
  lightModeTitle: string;
  lightModeDesc: string;
  darkOption: string;
  lightOption: string;
  deviceNotificationsSection: string;
  deviceNotificationsTitle: string;
  deviceNotificationsDesc: string;
  requestNotificationPerm: string;
  testNotification: string;
  testNotificationBody: string;
  testNotificationSent: string;
  chatOptions: string;
  profile: string;
  messageOptions: string;
  replyToMessage: string;
  editText: string;
  starOption: string;
  unstarOption: string;
  deleteMessageOption: string;
  languageTitle: string;
  languageDesc: string;
  mediaSection: string;
  highQualityMediaTitle: string;
  highQualityMediaDesc: string;
  securitySection: string;
  changePasswordTitle: string;
  changePasswordDesc: string;
  blockedAccountsTitle: string;
  blockedAccountsDesc: string;
  logout: string;
  logoutConfirm: string;
  oldPasswordLabel: string;
  newPasswordLabel: string;
  confirmPasswordLabel: string;

  // Media Quality Indicator
  quality4k: string;
  qualityDataSaver: string;
}

export const translations: Record<AppLanguage, Translations> = {
  ARABIC: {
    appName: 'NT MASSAGE',
    cancel: 'إلغاء',
    delete: 'حذف',
    confirm: 'تأكيد',
    save: 'حفظ',
    edit: 'تعديل',
    loading: 'جاري التحميل...',
    send: 'إرسال',
    close: 'إغلاق',
    search: 'بحث',
    online: 'متصل الآن',
    offline: 'غير متصل',
    back: 'رجوع',
    done: 'تم',
    error: 'حدث خطأ',
    success: 'تم بنجاح',
    you: 'أنت',
    publish: 'نشر الآن',
    language: 'اللغة',
    notifications: 'التنبيهات والإشعارات',
    soundEffects: 'المؤثرات الصوتية والنغمات',
    vibration: 'الاهتزاز',
    privacy: 'الخصوصية والأمان',
    blockedUsers: 'الحسابات المحظورة',
    changePassword: 'تغيير كلمة المرور',
    passwordChangedSuccess: 'تم تغيير كلمة المرور بنجاح!',
    currentPassword: 'كلمة المرور الحالية',
    newPassword: 'كلمة المرور الجديدة',
    confirmNewPassword: 'تأكيد كلمة المرور الجديدة',
    backupAndData: 'النسخ الاحتياطي والبيانات',
    exportChatHistory: 'تصدير نسخة احتياطية من المحادثات (JSON)',
    clearCache: 'مسح البيانات المؤقتة',
    deleteAccount: 'حذف الحساب نهائياً',
    deleteAccountConfirm: 'هل أنت متأكد من رغبتك بحذف حسابك وكافة محتوياته بشكل نهائي؟',
    enablePushNotifications: 'تفعيل إشعارات الخلفية',
    writeCaption: 'اكتب وصفاً للمنشور...',
    passwordValidation: 'يجب أن تتكون كلمة المرور من 6 خانات على الأقل',
    chats: 'المحادثات',
    feed: 'المنشورات',
    posts: 'المنشورات',
    followers: 'المتابعون',
    following: 'المتابَعون',
    directTitle: 'الرسائل المباشرة',
    searchUsersPlaceholder: 'ابحث عن مستخدمين (@username)...',
    noChatsYet: 'لا توجد محادثات بعد',
    startChatting: 'ابدأ بالبحث عن أصدقائك والتواصل معهم فوراً!',
    noSearchResults: 'لم يتم العثور على نتائج للبحث',
    stories: 'القصص',
    yourStory: 'قصتك',
    addStory: 'إضافة قصة',
    newPost: 'منشور جديد',
    newStory: 'قصة جديدة',
    pinned: 'مثبت',
    favorite: 'مفضل',
    muted: 'مكتوم',
    pinChat: 'تثبيت في الأعلى',
    unpinChat: 'إلغاء التثبيت',
    favChat: 'إضافة للمفضلة',
    unfavChat: 'إزالة من المفضلة',
    muteChat: 'كتم الإشعارات',
    unmuteChat: 'إلغاء كتم الإشعارات',
    deleteChat: 'حذف المحادثة',
    confirmDeleteChat: 'هل أنت متأكد من رغبتك بحذف كافة رسائل هذه المحادثة نهائياً؟',
    typeMessagePlaceholder: 'اكتب رسالة مشفرة...',
    recordingVoice: 'جاري تسجيل رسالة صوتية... تحدث الآن',
    uploadingMedia: 'جاري رفع الوسائط بأعلى جودة...',
    voiceCall: 'مكالمة صوتية',
    videoCall: 'مكالمة فيديو فورية',
    replyTo: 'رد على',
    editMessage: 'تعديل الرسالة',
    deleteMessage: 'حذف الرسالة',
    starMessage: 'تمييز بنجمة',
    unstarMessage: 'إلغاء النجمة',
    copyText: 'نسخ النص',
    textCopied: 'تم نسخ النص إلى الحافظة',
    mediaPhoto: '📷 صورة',
    mediaVideo: '📹 فيديو',
    mediaVoice: '🎤 تسجيل صوتي',
    holdToOptions: 'انقر مطولاً أو اضغط على النقاط للخيارات',
    likes: 'الإعجابات',
    comments: 'التعليقات',
    addCommentPlaceholder: 'أضف تعليقاً...',
    postCaptionPlaceholder: 'اكتب وصفاً أو هاشتاغات #NT_MASSAGE...',
    writeCaptionPlaceholder: 'اكتب وصفاً للمنشور...',
    createPostTitle: 'إنشاء منشور جديد',
    publishPost: 'نشر الآن',
    selectPhotoOrVideo: 'اختر صورة أو فيديو عالي الدقة (4K)',
    deletePostConfirm: 'هل أنت متأكد من حذف هذا المنشور بشكل نهائي؟',
    editCaption: 'تعديل الوصف',
    savePost: 'حفظ المنشور',
    savedPosts: 'العناصر المحفوظة',
    noPostsYet: 'لا توجد منشورات بعد',
    noFeedPosts: 'لا توجد منشورات في الصفحة الرئيسية',
    sharePost: 'مشاركة المنشور',
    downloadMedia: 'حفظ بدقة 4K',
    downloadSuccess: 'تم تحميل الملف بنجاح',
    cropAndRotate: 'قص وتدوير',
    storyReplyPlaceholder: 'رد على القصة...',
    deleteStoryConfirm: 'هل أنت متأكد من حذف هذه القصة نهائياً؟',
    viewers: 'المشاهدات',
    noViewersYet: 'لا توجد مشاهدات بعد',
    storyViewersTitle: 'الحسابات التي شاهدت قصتك',
    viewsCount: 'مشاهدة',
    replySent: 'تم إرسال الرد إلى الخاص',
    createStoryTitle: 'قصة جديدة (24 ساعة)',
    publishStory: 'مشاركة بالقصة',
    storyRemainingTime: 'تختفي القصة تلقائياً بعد مرور 24 ساعة',
    editProfile: 'تعديل الملف الشخصي',
    bioPlaceholder: 'اكتب نبذة تعريفية (Bio)...',
    displayNameLabel: 'الاسم الظاهر',
    displayNamePlaceholder: 'الاسم الظاهر',
    usernameLabel: 'اسم المستخدم',
    usernamePlaceholder: 'اسم المستخدم (@)',
    emailLabel: 'البريد أو الهاتف',
    changeAvatar: 'تغيير الصورة الشخصية',
    follow: 'متابعة',
    unfollow: 'إلغاء المتابعة',
    closeFriend: 'صديق مقرب',
    addCloseFriend: 'إضافة للأصدقاء المقربين',
    removeCloseFriend: 'إزالة من المقربين',
    block: 'حظر المستخدم',
    unblock: 'إلغاء الحظر',
    blockConfirm: 'هل تريد حظر هذا المستخدم؟ لن يتمكن من مراسلتك مجدداً.',
    unblockConfirm: 'هل تريد إلغاء حظر هذا المستخدم؟',
    blockedUsersTitle: 'الحسابات المحظورة',
    noBlockedUsers: 'لا توجد حسابات محظورة',
    settingsTitle: 'الإعدادات والمظهر',
    appearanceSection: 'المظهر والسمات',
    darkModeTitle: 'الوضع الليلي (أسود فاحم)',
    darkModeDesc: 'تصميم أنيق يوفر طاقة الشاشة ومريح للعين',
    lightModeTitle: 'الوضع النهاري (أبيض)',
    lightModeDesc: 'مظهر ناصع عالي الوضوح والتباين',
    darkOption: 'داكن',
    lightOption: 'فاتح',
    deviceNotificationsSection: 'إشعارات وتنبيهات الجهاز',
    deviceNotificationsTitle: 'إشعارات الرسائل والمكالمات',
    deviceNotificationsDesc: 'استقبال تنبيهات النظام حتى عندما يكون التطبيق مغلقاً',
    requestNotificationPerm: 'تفعيل إذن الإشعارات',
    testNotification: 'اختبار تنبيه فوري',
    testNotificationBody: 'مرحباً! هذا إشعار تجريبي بصوت تنبيه فوري 🔔',
    testNotificationSent: 'تم تفعيل إشعارات الجهاز بنجاح! ستصلك تنبيهات مثل تطبيق Instagram.',
    chatOptions: 'خيارات المحادثة',
    profile: 'الملف الشخصي',
    messageOptions: 'خيارات الرسالة',
    replyToMessage: 'الرد على الرسالة',
    editText: 'تعديل النص',
    starOption: 'تمييز بنجمة',
    unstarOption: 'إزالة النجمة',
    deleteMessageOption: 'حذف الرسالة',
    languageTitle: 'لغة التطبيق',
    languageDesc: 'التبديل بين العربية والإنجليزية لجميع الواجهات',
    mediaSection: 'الوسائط وجودة العرض',
    highQualityMediaTitle: 'الرفع والتحميل بدقة 4K UHD الأصلية',
    highQualityMediaDesc: 'الحفاظ على الدقة الفائقة للصور والفيديوهات بدون ضغط مشوه',
    securitySection: 'الأمان والحساب',
    changePasswordTitle: 'تغيير كلمة المرور',
    changePasswordDesc: 'تحديث كلمة المرور لحسابك بشكل آمن',
    blockedAccountsTitle: 'الحسابات المحظورة',
    blockedAccountsDesc: 'إدارة قائمة المستخدمين المحظورين',
    logout: 'تسجيل الخروج',
    logoutConfirm: 'هل أنت متأكد من تسجيل الخروج من NT MASSAGE؟',
    oldPasswordLabel: 'كلمة المرور الحالية',
    newPasswordLabel: 'كلمة المرور الجديدة (8+ خانات)',
    confirmPasswordLabel: 'تأكيد كلمة المرور الجديدة',
    quality4k: 'أعلى جودة 4K UHD',
    qualityDataSaver: 'توفير البيانات (مضغوط وسريع)',
  },
  ENGLISH: {
    appName: 'NT MASSAGE',
    cancel: 'Cancel',
    delete: 'Delete',
    confirm: 'Confirm',
    save: 'Save',
    edit: 'Edit',
    loading: 'Loading...',
    send: 'Send',
    close: 'Close',
    search: 'Search',
    online: 'Online',
    offline: 'Offline',
    back: 'Back',
    done: 'Done',
    error: 'An error occurred',
    success: 'Success',
    you: 'You',
    publish: 'Publish Now',
    language: 'Language',
    notifications: 'Notifications & Alerts',
    soundEffects: 'Sound Effects & Tones',
    vibration: 'Vibration',
    privacy: 'Privacy & Security',
    blockedUsers: 'Blocked Users',
    changePassword: 'Change Password',
    passwordChangedSuccess: 'Password changed successfully!',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmNewPassword: 'Confirm New Password',
    backupAndData: 'Backup & Data',
    exportChatHistory: 'Export Chat Backup (JSON)',
    clearCache: 'Clear Cache',
    deleteAccount: 'Delete Account Permanently',
    deleteAccountConfirm: 'Are you sure you want to permanently delete your account and all data?',
    enablePushNotifications: 'Enable Background Notifications',
    writeCaption: 'Write a caption...',
    passwordValidation: 'Password must be at least 6 characters',
    chats: 'Chats',
    feed: 'Feed',
    posts: 'Posts',
    followers: 'Followers',
    following: 'Following',
    directTitle: 'Direct Messages',
    searchUsersPlaceholder: 'Search users (@username)...',
    noChatsYet: 'No direct conversations yet',
    startChatting: 'Use the search bar above to find friends and start chatting instantly!',
    noSearchResults: 'No users found matching this search',
    stories: 'Stories',
    yourStory: 'Your Story',
    addStory: 'Add Story',
    newPost: 'New Post',
    newStory: 'New Story',
    pinned: 'Pinned',
    favorite: 'Favorite',
    muted: 'Muted',
    pinChat: 'Pin to top',
    unpinChat: 'Unpin chat',
    favChat: 'Add to favorites',
    unfavChat: 'Remove from favorites',
    muteChat: 'Mute notifications',
    unmuteChat: 'Unmute notifications',
    deleteChat: 'Delete Conversation',
    confirmDeleteChat: 'Are you sure you want to permanently delete all messages in this chat?',
    typeMessagePlaceholder: 'Type an encrypted message...',
    recordingVoice: 'Recording voice message... Speak now',
    uploadingMedia: 'Uploading media in high quality...',
    voiceCall: 'Voice Call',
    videoCall: 'Live Video Call',
    replyTo: 'Replying to',
    editMessage: 'Edit Message',
    deleteMessage: 'Delete Message',
    starMessage: 'Star Message',
    unstarMessage: 'Unstar Message',
    copyText: 'Copy Text',
    textCopied: 'Message copied to clipboard',
    mediaPhoto: '📷 Photo',
    mediaVideo: '📹 Video',
    mediaVoice: '🎤 Voice Message',
    holdToOptions: 'Click 3-dots or hold message for options',
    likes: 'Likes',
    comments: 'Comments',
    addCommentPlaceholder: 'Add a comment...',
    postCaptionPlaceholder: 'Write a caption or hashtags #NT_MASSAGE...',
    writeCaptionPlaceholder: 'Write a caption or hashtags #NT_MASSAGE...',
    createPostTitle: 'Create New Post',
    publishPost: 'Publish Post',
    selectPhotoOrVideo: 'Select high-quality photo or video (4K)',
    deletePostConfirm: 'Are you sure you want to permanently delete this post?',
    editCaption: 'Edit Caption',
    savePost: 'Save Post',
    savedPosts: 'Saved Items',
    noPostsYet: 'No posts yet',
    noFeedPosts: 'No posts in feed yet',
    sharePost: 'Share Post',
    downloadMedia: 'Save 4K',
    downloadSuccess: 'File downloaded successfully',
    cropAndRotate: 'Crop & Rotate',
    storyReplyPlaceholder: 'Reply to story...',
    deleteStoryConfirm: 'Are you sure you want to permanently delete this story?',
    viewers: 'Viewers',
    noViewersYet: 'No viewers yet',
    storyViewersTitle: 'Accounts who viewed your story',
    viewsCount: 'views',
    replySent: 'Reply sent to DM',
    createStoryTitle: 'New Story (24 Hours)',
    publishStory: 'Share Story',
    storyRemainingTime: 'Story disappears automatically after 24 hours',
    editProfile: 'Edit Profile',
    bioPlaceholder: 'Bio description...',
    displayNameLabel: 'Display Name',
    displayNamePlaceholder: 'Display Name',
    usernameLabel: 'Username',
    usernamePlaceholder: 'Username (@)',
    emailLabel: 'Email or Phone',
    changeAvatar: 'Change Avatar',
    follow: 'Follow',
    unfollow: 'Unfollow',
    closeFriend: 'Close Friend',
    addCloseFriend: 'Add to Close Friends',
    removeCloseFriend: 'Remove from Close Friends',
    block: 'Block User',
    unblock: 'Unblock User',
    blockConfirm: 'Do you want to block this user? They will not be able to message you.',
    unblockConfirm: 'Do you want to unblock this user?',
    blockedUsersTitle: 'Blocked Accounts',
    noBlockedUsers: 'No blocked users in your list',
    settingsTitle: 'Settings & Appearance',
    appearanceSection: 'Appearance & Theme',
    darkModeTitle: 'Dark Mode (Black)',
    darkModeDesc: 'Sleek dark theme for battery saving and comfort',
    lightModeTitle: 'Light Mode (White)',
    lightModeDesc: 'Clean bright theme with high clarity',
    darkOption: 'Dark',
    lightOption: 'Light',
    deviceNotificationsSection: 'Device Notifications & Alerts',
    deviceNotificationsTitle: 'Messages & Calls Notifications',
    deviceNotificationsDesc: 'Receive instant device alerts when messages or calls arrive',
    requestNotificationPerm: 'Enable & Request Notification Permission',
    testNotification: 'Test Instant Alert',
    testNotificationBody: 'Hello! This is a test notification with sound 🔔',
    testNotificationSent: 'Device notifications enabled successfully! You will receive alerts like Instagram.',
    chatOptions: 'Chat Options',
    profile: 'Profile',
    messageOptions: 'Message Options',
    replyToMessage: 'Reply to Message',
    editText: 'Edit Text',
    starOption: 'Star Message',
    unstarOption: 'Unstar Message',
    deleteMessageOption: 'Delete Message',
    languageTitle: 'App Language',
    languageDesc: 'Switch between Arabic & English for all menus',
    mediaSection: 'Media & Quality',
    highQualityMediaTitle: 'Upload & Download in Original 4K UHD',
    highQualityMediaDesc: 'Keep uncompressed original resolution for photos and video reels',
    securitySection: 'Security & Account',
    changePasswordTitle: 'Change Password',
    changePasswordDesc: 'Update your account password securely',
    blockedAccountsTitle: 'Blocked Accounts',
    blockedAccountsDesc: 'Manage blocked users',
    logout: 'Log Out',
    logoutConfirm: 'Are you sure you want to log out from NT MASSAGE?',
    oldPasswordLabel: 'Current Password',
    newPasswordLabel: 'New Password (8+ characters)',
    confirmPasswordLabel: 'Confirm New Password',
    quality4k: '4K UHD Ultra Quality',
    qualityDataSaver: 'Data Saver (Compressed & Fast)',
  },
};

export function getT(lang?: string | AppLanguage): Translations {
  if (lang === 'ENGLISH' || lang === 'en') {
    return translations.ENGLISH;
  }
  return translations.ARABIC;
}
