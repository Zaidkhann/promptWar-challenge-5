import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Event, BudgetSummary, TimelineSummary, AIPlanOutput } from '../types';
import { eventService } from '../services/eventService';
import { useAuth } from './AuthContext';

interface EventContextType {
  events: Event[];
  activeEvent: Event | null;
  activeEventDetail: (Event & {
    budgetSummary: BudgetSummary;
    timelineSummary: TimelineSummary;
    aiPlan: {
      plan: AIPlanOutput;
      is_demo: boolean;
      model: string;
      updated_at: string;
    } | null;
  }) | null;
  loading: boolean;
  setActiveEventId: (id: string | null) => void;
  refreshEvents: () => Promise<void>;
  refreshActiveEvent: () => Promise<void>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [activeEventDetail, setActiveEventDetail] = useState<EventContextType['activeEventDetail']>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const refreshEvents = useCallback(async () => {
    if (!user) {
      setEvents([]);
      setActiveEventId(null);
      setActiveEventDetail(null);
      return;
    }

    try {
      setLoading(true);
      const res = await eventService.getEvents();
      const list = res.data || [];
      setEvents(list);

      // If activeEventId is not set or not in current list, pick first event
      if (list.length > 0) {
        if (!activeEventId || !list.some((e) => e.id === activeEventId)) {
          setActiveEventId(list[0].id);
        }
      } else {
        setActiveEventId(null);
        setActiveEventDetail(null);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  }, [user, activeEventId]);

  const refreshActiveEvent = useCallback(async () => {
    if (!activeEventId) {
      setActiveEventDetail(null);
      return;
    }

    try {
      const res = await eventService.getEventById(activeEventId);
      if (res.data) {
        setActiveEventDetail(res.data);
      }
    } catch (err) {
      console.error('Failed to load active event details:', err);
    }
  }, [activeEventId]);

  useEffect(() => {
    refreshEvents();
  }, [user]);

  useEffect(() => {
    if (activeEventId) {
      refreshActiveEvent();
    }
  }, [activeEventId]);

  const activeEvent = events.find((e) => e.id === activeEventId) || null;

  return (
    <EventContext.Provider
      value={{
        events,
        activeEvent,
        activeEventDetail,
        loading,
        setActiveEventId,
        refreshEvents,
        refreshActiveEvent,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export function useEvent(): EventContextType {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
}
