import React, { useState } from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Wallet,
  Clock,
  Users,
  Lightbulb,
  PartyPopper,
  Calendar,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EventProvider, useEvent } from './context/EventContext';
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

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const { activeEvent } = useEvent();

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);

  const handleEventCreated = (newEventId: string, triggerAiPlan: boolean) => {
    if (triggerAiPlan) {
      setActiveTab('planner');
    }
  };

  return (
    <div className="app-container">
      {/* Navbar Header */}
      <Navbar
        onOpenCreateEvent={() => setIsCreateEventModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Tabs Navigation Bar */}
      {user && (
        <nav className="tabs-navigation" aria-label="Main Navigation">
          <div className="tabs-inner" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'dashboard'}
              className={`nav-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={16} aria-hidden="true" />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'planner'}
              className={`nav-tab-btn ${activeTab === 'planner' ? 'active' : ''}`}
              onClick={() => setActiveTab('planner')}
            >
              <Sparkles size={16} color="var(--primary-600)" aria-hidden="true" />
              <span>AI Planner</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'budget'}
              className={`nav-tab-btn ${activeTab === 'budget' ? 'active' : ''}`}
              onClick={() => setActiveTab('budget')}
            >
              <Wallet size={16} aria-hidden="true" />
              <span>Smart Budget</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'timeline'}
              className={`nav-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              <Clock size={16} aria-hidden="true" />
              <span>Timeline & Tasks</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'vendors'}
              className={`nav-tab-btn ${activeTab === 'vendors' ? 'active' : ''}`}
              onClick={() => setActiveTab('vendors')}
            >
              <Users size={16} aria-hidden="true" />
              <span>Vendors</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'recommendations'}
              className={`nav-tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
              onClick={() => setActiveTab('recommendations')}
            >
              <Lightbulb size={16} aria-hidden="true" />
              <span>Recommendations</span>
            </button>
          </div>
        </nav>
      )}

      {/* Main Content Area */}
      <main className="main-content" role="main">
        {!user ? (
          <div className="card empty-state" style={{ maxWidth: '640px', margin: '40px auto' }}>
            <div className="empty-state-icon">
              <PartyPopper size={36} />
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
              >
                <Sparkles size={18} />
                <span>Get Started with Demo Access</span>
              </button>
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}
      </main>

      {/* Dialog Modals */}
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
