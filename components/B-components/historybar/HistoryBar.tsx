"use client";

import { useAppSelector } from '../../../lib/hooks';
import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  type SpringOptions,
  AnimatePresence,
} from "framer-motion";
import React, {
  Children,
  cloneElement,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAppDispatch } from '../../../lib/hooks';
import { addToolToHistory, clearHistoryForNewUser } from '../../../lib/slices/historySlice';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';

import "./HistoryBar.css";

export type DockItemData = {
  icon: React.ReactNode;
  label: React.ReactNode;
  onClick: () => void;
  className?: string;
};

type DockItemProps = {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  mouseX: MotionValue;
  spring: SpringOptions;
  distance: number;
  baseItemSize: number;
  magnification: number;
};

function DockItem({
  children,
  className = "",
  onClick,
  mouseX,
  spring,
  distance,
  magnification,
  baseItemSize,
}: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, (val) => {
    const rect = ref.current?.getBoundingClientRect() ?? {
      x: 0,
      width: baseItemSize,
    };
    return val - rect.x - baseItemSize / 2;
  });

  const targetSize = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [baseItemSize, magnification, baseItemSize]
  );
  const size = useSpring(targetSize, spring);

  return (
    <motion.div
      ref={ref}
      style={{
        width: size,
        height: size,
      }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      className={`dock-item ${className}`}
      tabIndex={0}
      role="button"
      aria-haspopup="true"
    >
      {Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return cloneElement(child, { isHovered } as { isHovered: MotionValue<number> });
        }
        return child;
      })}
    </motion.div>
  );
}

type DockLabelProps = {
  className?: string;
  children: React.ReactNode;
  isHovered?: MotionValue<number>;
};

function DockLabel({ children, className = "", isHovered }: DockLabelProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isHovered) return;
    
    const unsubscribe = isHovered.on("change", (latest) => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -10 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`dock-label ${className}`}
          role="tooltip"
          style={{ x: "-50%" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type DockIconProps = {
  className?: string;
  children: React.ReactNode;
};

function DockIcon({ children, className = "" }: DockIconProps) {
  return <div className={`dock-icon ${className}`}>{children}</div>;
}

export default function HistoryBar() {
  const dispatch = useAppDispatch();
  const { tools } = useAppSelector((state) => state.history);
  const { user } = useUser();
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);
  const [isClient, setIsClient] = useState(false);
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  // Handle user change detection and history clearing
  useEffect(() => {
    const currentUserId = user?.id;
    
    // If user logged out (no user), clear history
    if (!user && lastUserId) {
      // User logged out, clearing history
      dispatch(clearHistoryForNewUser());
      setLastUserId(null);
      return;
    }
    
    // If this is a new user (different from last user), clear history
    if (user && lastUserId && lastUserId !== currentUserId) {
      // New user detected, clearing history
      dispatch(clearHistoryForNewUser());
    }
    
    // Update last user ID
    if (user) {
      setLastUserId(currentUserId || null);
    }
  }, [user, lastUserId, dispatch]);

  // Listen for sign-out events to clear history immediately
  useEffect(() => {
    const handleSignOut = () => {
      // Sign-out detected, clearing history immediately
      dispatch(clearHistoryForNewUser());
      setLastUserId(null);
    };

    // Listen for sign-out events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === '__clerk_client_jwt' && !e.newValue) {
        // JWT cleared, user signed out
        handleSignOut();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [dispatch]);

  // Load history from localStorage on client side
  useEffect(() => {
    setIsClient(true);
    try {
      const stored = localStorage.getItem('toolHistory');
      if (stored) {
        const historyData = JSON.parse(stored);
        // Ensure we don't exceed maxItems when loading from localStorage
        const limitedHistory = historyData.slice(0, 5); // Limit to 5 items
        // Dispatch to update the store with loaded data
        limitedHistory.forEach((tool: { id: string; name: string; logo: string; url: string }) => {
          dispatch(addToolToHistory(tool));
        });
      }
    } catch (error) {
      console.error('Error loading history from localStorage:', error);
    }
  }, [dispatch]);

  const spring = { mass: 0.1, stiffness: 150, damping: 12 };
  const magnification = 70;
  const distance = 200;
  const panelHeight = 68;
  const baseItemSize = 50;






  // Convert tools to dock items (FIFO - shows 5 most recent)
  const dockItems: DockItemData[] = tools.slice(0, 5).map((tool) => ({
    icon: (
      <div style={{ 
        width: '60px',
        height: '60px',
        borderRadius: '8px',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        border: '1px solid #000000'
      }}>
        <Image 
          src={tool.logo} 
          alt={tool.name}
          width={44}
          height={44}
          quality={100}
          unoptimized={true}
          className="history-bar-image"
          style={{ 
            objectFit: 'cover',
            borderRadius: '4px'
          }}
        />
      </div>
    ),
    label: tool.name,
    onClick: () => {
      // Visit the tool URL
      window.open(tool.url, '_blank', 'noopener,noreferrer');
    },
  }));

  // Debug logging
      // HistoryBar - Current tools and dock items updated

  // Don't render until client side is ready
  if (!isClient) {
    return null;
  }



  if (tools.length === 0) {
    return (
      <div className="dock-outer">
        <div
          className="dock-panel"
          style={{ height: panelHeight }}
          role="toolbar"
          aria-label="Application dock"
        >
          <div style={{ 
            color: '#fff', 
            fontSize: '12px', 
            fontStyle: 'italic',
            padding: '8px 16px',
            textAlign: 'center'
          }}>
            Recent Visited Tools
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dock-outer">
      <motion.div
        onMouseMove={({ pageX }) => {
          isHovered.set(1);
          mouseX.set(pageX);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseX.set(Infinity);
        }}
        className="dock-panel"
        style={{ height: panelHeight }}
        role="toolbar"
        aria-label="Application dock"
      >
        {dockItems.map((item, index) => (
          <DockItem
            key={index}
            onClick={item.onClick}
            className={item.className}
            mouseX={mouseX}
            spring={spring}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
          >
            <DockIcon>{item.icon}</DockIcon>
            <DockLabel>{item.label}</DockLabel>
          </DockItem>
        ))}
      </motion.div>
    </div>
  );
} 