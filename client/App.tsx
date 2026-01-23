import React, { useState, useEffect } from "react";
import { Menu } from "lucide-react";

import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";
import PasswordModal from "./components/PasswordModal";

import { useAuth } from "./context/AuthContext";
import { View } from "./types";

const App: React.FC = () => {
  const { user: currentUser, logout, updateUser, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Check for forced password change on login
  useEffect(() => {
    if (currentUser?.mustChangePassword) {
      setIsPasswordModalOpen(true);
      setProfileMenuOpen(false);
    }
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#204294]"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <Login
        onLogin={async (user) => {
          updateUser(user);
        }}
      />
    );
  }

  const handleLogout = () => {
    logout();
    setProfileMenuOpen(false);
    setCurrentView(View.DASHBOARD);
  };

  const openPasswordModal = () => {
    setProfileMenuOpen(false);
    setIsPasswordModalOpen(true);
  };

  const onPasswordChangeSuccess = () => {
    updateUser({
      ...currentUser,
      mustChangePassword: false,
    });
    setIsPasswordModalOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      <Sidebar
        currentUser={currentUser}
        currentView={currentView}
        setCurrentView={setCurrentView}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        profileMenuOpen={profileMenuOpen}
        setProfileMenuOpen={setProfileMenuOpen}
        handleLogout={handleLogout}
        openPasswordModal={openPasswordModal}
      />

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <div className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex flex-col leading-tight">
            <span className="text-xl font-extrabold text-[#204294] tracking-tight">
              CCM
            </span>
            <span className="text-[10px] font-medium text-[#00B0EA] tracking-widest uppercase">
              Smart Time
            </span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#204294] rounded-lg hover:bg-slate-100"
          >
            <Menu size={24} />
          </button>
        </div>

        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <MainContent currentView={currentView} currentUser={currentUser} />
        </main>
      </div>

      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        currentUser={currentUser}
        onSuccess={onPasswordChangeSuccess}
      />
    </div>
  );
};

export default App;
