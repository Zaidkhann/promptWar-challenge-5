import React, { useState } from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Wallet,
  Clock,
  Users,
  Lightbulb,
  PartyPopper,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EventProvider } from './context/EventContext';
import { Navbar } from './components/common/Navbar';
import { AuthModal } from './components/common/AuthModal';
import { EventFormModal } from './components/events/EventFormModal';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { AiPlannerView } from './components/ai/AiPlannerView';
import { BudgetTracker } from './components/budget/BudgetTracker';
import { TimelineView } from './components/timeline/TimelineView';
import { VendorView } from './components/vendors/VendorView';
import { RecommendationsView } from './components/ai/RecommendationsView';

type TabType = 'dashboard' | 'planner' | 'budget' | 'timeline' | 'vendors' | 'recommendations';

const tabsConfig: Array<{ id: TabType; label: string; icon: React.ReactNode }> = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} aria-hidden="true" /> },
  { id: 'planner', label: 'AI Planner', icon: <Sparkles size={16} color="var(--primary-600)" aria-hidden="true" /> },
  { id: 'budget', label: 'Smart Budget', icon: <Wallet size={16} aria-hidden="true" /> },
  { id: 'timeline', label: 'Timeline & Tasks', icon: <Clock size={16} aria-hidden="true" /> },
  { id: 'vendors', label: 'Vendors', icon: <Users size={16} aria-hidden="true" /> },
  { id: 'recommendations', label: 'Recommendations', icon: <Lightbulb size={16} aria-hidden="true" /> },
];

const MainApp: React.FC = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);

  const handleEventCreated = (_newEventId: string, triggerAiPlan: boolean) => {
    if (triggerAiPlan) {
      setActiveTab('planner');
    }
  };

  const handleKeyDownTab = (e: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    if (e.key === 'ArrowRight') {
      const nextIndex = (currentIndex + 1) % tabsConfig.length;
      setActiveTab(tabsConfig[nextIndex].id);
    } else if (e.key === 'ArrowLeft') {
      const prevIndex = (currentIndex - 1 + tabsConfig.length) % tabsConfig.length;
      setActiveTab(tabsConfig[prevIndex].id);
    }
  };

  return (
    <div className="app-container">
      {/* WCAG 2.2 Skip to Content Link for Keyboard & Screen Reader Users */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Navbar Header */}
      <Navbar
        onOpenCreateEvent={() => setIsCreateEventModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Tabs Navigation Bar adhering to WAI-ARIA Tabs pattern */}
      {user && (
        <nav className="tabs-navigation" aria-label="Main Navigation">
          <div className="tabs-inner" role="tablist" aria-label="Event Management Tabs">
            {tabsConfig.map((tab, index) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-controls={`panel-${tab.id}`}
                  tabIndex={isSelected ? 0 : -1}
                  className={`nav-tab-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(e) => handleKeyDownTab(e, index)}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Main Landmark Area */}
      <main id="main-content" className="main-content" role="main" tabIndex={-1}>
        {!user ? (
          <div className="card empty-state" style={{ maxWidth: '640px', margin: '40px auto' }}>
            <div className="empty-state-icon">
              <PartyPopper size={36} aria-hidden="true" />
            </div>
            <h1 className="empty-state-title" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
              CelebraPlan AI
            </h1>
            <p className="empty-state-desc" style={{ fontSize: '1rem', lineHeight: 1.6, marginBottom: '24px' }}>
              Intelligent GenAI-powered Celebration & Event Planning Platform for weddings, birthdays, and community gatherings. Powered by Google Gemini 2.5 Flash.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={() => setIsAuthModalOpen(true)}
                aria-haspopup="dialog"
              >
                <Sparkles size={18} aria-hidden="true" />
                <span>Get Started with Demo Access</span>
              </button>
            </div>
          </div>
        ) : (
          <div
            role="tabpanel"
            id={`panel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            tabIndex={0}
            style={{ outline: 'none' }}
          >
            {activeTab === 'dashboard' && (
              <DashboardOverview
                onNavigateTab={(tab) => setActiveTab(tab)}
                onOpenCreateEvent={() => setIsCreateEventModalOpen(true)}
                onOpenExpenseModal={() => setActiveTab('budget')}
              />
            )}

            {activeTab === 'planner' && <AiPlannerView />}

            {activeTab === 'budget' && <BudgetTracker />}

            {activeTab === 'timeline' && <TimelineView />}

            {activeTab === 'vendors' && <VendorView />}

            {activeTab === 'recommendations' && <RecommendationsView />}
          </div>
        )}
      </main>

      {/* Accessible Dialog Modals */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      <EventFormModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        onEventCreated={handleEventCreated}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <EventProvider>
        <MainApp />
      </EventProvider>
    </AuthProvider>
  );
};

export default App;
