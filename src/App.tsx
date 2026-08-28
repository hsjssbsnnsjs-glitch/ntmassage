import React, { useState, useEffect } from 'react';
import { storage } from './lib/storage';
import { notificationManager } from './lib/notifications';
import { User, AppScreen, UserStoryGroup, CallType, AppLanguage } from './types';

// Screens
import { SplashScreen } from './screens/SplashScreen';
import { AuthScreen } from './screens/AuthScreen';
import { DirectListScreen } from './screens/DirectListScreen';
import { ChatScreen } from './screens/ChatScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { EditProfileScreen } from './screens/EditProfileScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { CreatePostScreen } from './screens/CreatePostScreen';
import { CreateStoryScreen } from './screens/CreateStoryScreen';
import { StoryViewerScreen } from './screens/StoryViewerScreen';
import { CallScreen } from './screens/CallScreen';

// Modals & Overlays
import { IncomingCallModal } from './components/IncomingCallModal';
import { NotificationBanner } from './components/NotificationBanner';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('SPLASH');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);

  // Language & Direction
  const [appLanguage, setAppLanguage] = useState<AppLanguage>(storage.getLanguage());

  // Story Viewer
  const [storyViewerData, setStoryViewerData] = useState<{
    allGroups: UserStoryGroup[];
    initialIndex: number;
  } | null>(null);

  // Active Outgoing/Connected Call
  const [activeCall, setActiveCall] = useState<{
    targetUser: User;
    callType: CallType;
    initialStatus?: 'RINGING' | 'CONNECTED';
    channelId?: string;
  } | null>(null);

  // Incoming Call State
  const [incomingCall, setIncomingCall] = useState<{
    caller: User;
    callType: CallType;
    channelId: string;
  } | null>(null);

  // Initial Sync and Auth Restore
  useEffect(() => {
    // Apply theme
    const savedTheme = storage.getThemeMode();
    storage.applyTheme(savedTheme);

    // Apply language direction to HTML body
    const isArabic = appLanguage === 'ARABIC';
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
    document.documentElement.lang = isArabic ? 'ar' : 'en';

    const initApp = async () => {
      try {
        await storage.syncFromServer();
      } catch (err) {
        console.warn('Backend sync deferred to offline cache:', err);
      }
      const savedUser = storage.getCurrentUser();
      if (savedUser) {
        setCurrentUser(savedUser);
      }
    };
    initApp();
  }, [appLanguage]);

  // Periodic Call Signaling & Background Message Listener (every 1.5s for fast delivery)
  useEffect(() => {
    if (!currentUser) return;

    const checkSignals = () => {
      // Check for incoming calls
      const activeSignals = storage.getIncomingCalls(currentUser.id);
      if (activeSignals.length > 0 && !activeCall && !incomingCall) {
        const signal = activeSignals[0];
        const caller = storage.getUserById(signal.fromUserId);
        if (caller && !storage.isBlocked(currentUser.id, caller.id)) {
          setIncomingCall({
            caller,
            callType: signal.callType,
            channelId: signal.channelId || signal.id,
          });
        }
      }
    };

    checkSignals();
    const interval = setInterval(checkSignals, 1500);
    return () => clearInterval(interval);
  }, [currentUser?.id, activeCall, incomingCall]);

  const handleSplashFinish = () => {
    if (currentUser) {
      setCurrentScreen('DIRECT_LIST');
    } else {
      setCurrentScreen('AUTH');
    }
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    storage.setCurrentUser(user);
    setCurrentScreen('DIRECT_LIST');
  };

  const handleLogout = () => {
    storage.setCurrentUser(null);
    setCurrentUser(null);
    setCurrentScreen('AUTH');
  };

  const handleStartCall = (targetUser: User, isVideo: boolean) => {
    if (!currentUser) return;
    const callType: CallType = isVideo ? 'VIDEO' : 'VOICE';
    const channelId = storage.initiateCall(currentUser.id, targetUser.id, callType);
    setActiveCall({
      targetUser,
      callType,
      initialStatus: 'RINGING',
      channelId,
    });
  };

  const handleAcceptIncomingCall = () => {
    if (!incomingCall || !currentUser) return;
    storage.acceptCall(incomingCall.channelId);
    setActiveCall({
      targetUser: incomingCall.caller,
      callType: incomingCall.callType,
      initialStatus: 'CONNECTED',
      channelId: incomingCall.channelId,
    });
    setIncomingCall(null);
  };

  const handleDeclineIncomingCall = () => {
    if (!incomingCall) return;
    storage.rejectCall(incomingCall.channelId);
    setIncomingCall(null);
  };

  const handleEndActiveCall = () => {
    if (activeCall && currentUser) {
      if (activeCall.channelId) {
        storage.endCall(activeCall.channelId);
      }
      storage.endAllUserCalls(currentUser.id);
    }
    setActiveCall(null);
  };

  const toggleAppLanguage = () => {
    const next: AppLanguage = appLanguage === 'ARABIC' ? 'ENGLISH' : 'ARABIC';
    setAppLanguage(next);
    storage.setLanguage(next);
  };

  return (
    <div id="app-root" className="min-h-screen bg-black text-white font-sans antialiased overflow-x-hidden selection:bg-white selection:text-black">
      {/* Global In-App Toast & System Notifications Banner */}
      <NotificationBanner
        onNotificationClick={(notif) => {
          if (notif.data?.userId) {
            setTargetUserId(notif.data.userId);
            setCurrentScreen('CHAT');
          }
        }}
      />

      {/* Incoming Call Overlay */}
      {incomingCall && (
        <IncomingCallModal
          caller={incomingCall.caller}
          callType={incomingCall.callType}
          onAccept={handleAcceptIncomingCall}
          onDecline={handleDeclineIncomingCall}
        />
      )}

      {/* Active Video / Audio Call Screen */}
      {activeCall && currentUser && (
        <CallScreen
          currentUser={currentUser}
          targetUser={activeCall.targetUser}
          callType={activeCall.callType}
          initialStatus={activeCall.initialStatus}
          channelId={activeCall.channelId}
          onEndCall={handleEndActiveCall}
        />
      )}

      {/* Story Viewer Screen */}
      {storyViewerData && currentUser && (
        <StoryViewerScreen
          currentUser={currentUser}
          allStoryGroups={storyViewerData.allGroups}
          initialGroupIndex={storyViewerData.initialIndex}
          onClose={() => setStoryViewerData(null)}
          onNavigateToChat={(uid) => {
            setStoryViewerData(null);
            setTargetUserId(uid);
            setCurrentScreen('CHAT');
          }}
        />
      )}

      {/* Screen Router */}
      {currentScreen === 'SPLASH' && (
        <SplashScreen onFinish={handleSplashFinish} />
      )}

      {currentScreen === 'AUTH' && (
        <AuthScreen
          onAuthSuccess={handleAuthSuccess}
          appLanguage={appLanguage}
          onToggleLanguage={toggleAppLanguage}
        />
      )}

      {currentScreen === 'DIRECT_LIST' && currentUser && (
        <DirectListScreen
          currentUser={currentUser}
          onNavigateToChat={(uid) => {
            setTargetUserId(uid);
            setCurrentScreen('CHAT');
          }}
          onNavigateToProfile={(uid) => {
            setTargetUserId(uid);
            setCurrentScreen('PROFILE');
          }}
          onNavigateToSettings={() => setCurrentScreen('SETTINGS')}
          onNavigateToCreatePost={() => setCurrentScreen('CREATE_POST')}
          onNavigateToCreateStory={() => setCurrentScreen('CREATE_STORY')}
          onOpenStoryViewer={(allGroups, initialIndex) => {
            setStoryViewerData({ allGroups, initialIndex });
          }}
        />
      )}

      {currentScreen === 'CHAT' && currentUser && targetUserId && (
        <ChatScreen
          currentUser={currentUser}
          targetUserId={targetUserId}
          onBack={() => setCurrentScreen('DIRECT_LIST')}
          onNavigateToProfile={(uid) => {
            setTargetUserId(uid);
            setCurrentScreen('PROFILE');
          }}
          onStartCall={(targetUser, isVideo) => {
            handleStartCall(targetUser, isVideo);
          }}
        />
      )}

      {currentScreen === 'PROFILE' && currentUser && targetUserId && (
        <ProfileScreen
          currentUser={currentUser}
          targetUserId={targetUserId}
          onBack={() => setCurrentScreen('DIRECT_LIST')}
          onNavigateToEditProfile={() => setCurrentScreen('EDIT_PROFILE')}
          onNavigateToCreatePost={() => setCurrentScreen('CREATE_POST')}
          onNavigateToSettings={() => setCurrentScreen('SETTINGS')}
          onNavigateToChat={(uid) => {
            setTargetUserId(uid);
            setCurrentScreen('CHAT');
          }}
          onNavigateToProfile={(uid) => {
            setTargetUserId(uid);
            setCurrentScreen('PROFILE');
          }}
        />
      )}

      {currentScreen === 'EDIT_PROFILE' && currentUser && (
        <EditProfileScreen
          currentUser={currentUser}
          onBack={() => setCurrentScreen('PROFILE')}
          onProfileUpdated={(updated) => {
            setCurrentUser(updated);
            storage.setCurrentUser(updated);
          }}
        />
      )}

      {currentScreen === 'SETTINGS' && currentUser && (
        <SettingsScreen
          currentUser={currentUser}
          onBack={() => setCurrentScreen('DIRECT_LIST')}
          onLogout={handleLogout}
        />
      )}

      {currentScreen === 'CREATE_POST' && currentUser && (
        <CreatePostScreen
          currentUser={currentUser}
          onBack={() => setCurrentScreen('DIRECT_LIST')}
          onPostCreated={() => setCurrentScreen('DIRECT_LIST')}
        />
      )}

      {currentScreen === 'CREATE_STORY' && currentUser && (
        <CreateStoryScreen
          currentUser={currentUser}
          onBack={() => setCurrentScreen('DIRECT_LIST')}
          onStoryCreated={() => setCurrentScreen('DIRECT_LIST')}
        />
      )}
    </div>
  );
}
