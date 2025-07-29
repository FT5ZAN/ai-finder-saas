'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useDispatch, useSelector } from 'react-redux';
import styles from './AIChatbot.module.css';
import { useAlert } from '@/components/B-components/alert/AlertContext';
import { RootState } from '@/lib/store';
import { addMessage, cleanupOldMessages, updateLastActivity, clearChat } from '@/lib/slices/chatSlice';
import type { ChatMessage, ToolResult } from '@/lib/slices/chatSlice';
import { useChatCleanup } from '@/lib/hooks/useChatCleanup';
import LikeButton from '@/components/S-components/LikeButton';
import SaveButton from '@/components/S-components/SaveButton';
import VisitButton from '@/components/S-components/VisitButton';

interface AIResponse {
  answer: string;
  tools: ToolResult[];
  moreLink: string;
  error?: string;
  isExactMatch?: boolean;
  toolNotFound?: boolean;
  missingTool?: string;
  missingCategory?: string;
}

interface ContextMenuProps {
  x: number;
  y: number;
  onClearChat: () => void;
  onClose: () => void;
}

function ContextMenu({ x, y, onClearChat, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div 
      ref={menuRef}
      className={styles.contextMenu}
      style={{ left: x, top: y }}
    >
      <button 
        onClick={onClearChat}
        className={styles.contextMenuItem}
      >
        🗑️ Clear Chat
      </button>
    </div>
  );
}

// Typing effect component for AI responses
function TypingEffect({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      // Calculate delay to complete in exactly 1.5 seconds (since AI processing takes ~1.5s)
      const totalDuration = 1500; // 1.5 seconds in milliseconds
      const delay = Math.max(totalDuration / text.length, 15); // Minimum 15ms delay for smooth effect
      
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, delay);

      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, onComplete]);

  return <p>{displayedText}</p>;
}

export default function AIChatbot() {
  const dispatch = useDispatch();
  const { messages } = useSelector((state: RootState) => state.chat);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);
  const { showSuccess } = useAlert();
  
  // ✅ FIXED: Ref for auto-scrolling within chat container
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Use chat cleanup hook for logout handling
  useChatCleanup();

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // Only show context menu on right-click with Ctrl key (to avoid touchpad)
    if (messages.length > 0 && e.button === 2 && e.ctrlKey) {
      setContextMenu({ x: e.clientX, y: e.clientY });
    }
  };

  const handleLeftClick = (e: React.MouseEvent) => {
    // Only show context menu on left-click with Ctrl key (to avoid touchpad)
    if (messages.length > 0 && e.button === 0 && e.ctrlKey) {
      setContextMenu({ x: e.clientX, y: e.clientY });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Show context menu on Ctrl+Shift+C
    if (e.ctrlKey && e.shiftKey && e.key === 'C' && messages.length > 0) {
      e.preventDefault();
      setContextMenu({ x: 100, y: 100 }); // Show at fixed position
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // Prevent context menu on touch events
    if (e.pointerType === 'touch') {
      e.preventDefault();
    }
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleClearChat = () => {
    dispatch(clearChat());
    showSuccess('Chat cleared successfully!');
    closeContextMenu();
  };

  // ✅ FIXED: Auto-scroll function that only scrolls within the chat container
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: Date.now()
    };

    dispatch(addMessage(userMessage));
    setInputText('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputText
        })
      });

      const data: AIResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: data.answer,
        isUser: false,
        timestamp: Date.now(),
        tools: data.tools,
        moreLink: data.moreLink,
        isExactMatch: data.isExactMatch,
        toolNotFound: data.toolNotFound,
        missingTool: data.missingTool,
        missingCategory: data.missingCategory
      };

      dispatch(addMessage(aiMessage));
      
      // Start typing effect for the new AI message
      setTypingMessageId(aiMessage.id);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('AI Agent Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleComplaintSubmit = async () => {
    if (!complaintText.trim()) return;

    setIsSubmittingComplaint(true);
    setError(null); // Clear any previous errors
    
    try {
      const response = await fetch('/api/complain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: complaintText.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit complaint');
      }

      showSuccess(data.message || 'Complaint submitted successfully!');
      setComplaintText('');
      setShowComplaintModal(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit complaint';
      setError(errorMessage);
      console.error('Complaint submission error:', err);
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  // Set client flag to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Cleanup old messages on component mount and set up periodic cleanup
  useEffect(() => {
    if (!isClient) return;
    
    // Clean up messages older than 1 hour on mount
    dispatch(cleanupOldMessages());
    
    // Set up periodic cleanup every 30 minutes
    const cleanupInterval = setInterval(() => {
      dispatch(cleanupOldMessages());
    }, 30 * 60 * 1000); // 30 minutes
    
    return () => clearInterval(cleanupInterval);
  }, [dispatch, isClient]);

  // Add welcome message when chat is empty and user first interacts
  useEffect(() => {
    if (!isClient || messages.length > 0) return;
    
    // Add welcome message after a short delay to ensure component is fully loaded
    const timer = setTimeout(() => {
      const welcomeMessage: ChatMessage = {
        id: 'welcome-message',
        text: "Hey user! Feel free to tell me your needs and problems. I will suggest you AI tools related to your needs and problems.",
        isUser: false,
        timestamp: Date.now()
      };
      dispatch(addMessage(welcomeMessage));
      setTypingMessageId(welcomeMessage.id);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [isClient, messages.length, dispatch]);

  // ✅ FIXED: Auto-scroll when messages change or loading state changes
  useEffect(() => {
    // Add a small delay when loading to ensure content is rendered
    if (isLoading) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      scrollToBottom();
    }
  }, [messages, isLoading]);

  // Update last activity when user interacts with the chat
  useEffect(() => {
    const handleUserActivity = () => {
      dispatch(updateLastActivity());
    };

    // Listen for user interactions
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);

    return () => {
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
    };
  }, [dispatch]);

  return (
    <div className={styles.container} data-testid="ai-chatbot">
      {/* Accessibility heading for screen readers */}
      <h1 className={styles.srOnly} data-testid="main-heading">AI Finder - Discover AI Tools</h1>
      <div 
        className={styles.chatContainer}
        onContextMenu={handleContextMenu}
        onClick={handleLeftClick}
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
        data-testid="chat-container"
      >
        {/* ✅ FIXED: Messages container with proper scrolling */}
        <div className={styles.messages} ref={messagesContainerRef}>
          {!isClient && (
            <div className={styles.loadingState}>
              <div className={styles.loadingDots}>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span>Loading chat...</span>
            </div>
          )}
          {isClient && messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.message} ${message.isUser ? styles.userMessage : styles.aiMessage} ${
                !message.isUser && typingMessageId === message.id ? styles.typing : ''
              }`}
            >
              <div className={styles.messageContent}>
                {/* ✅ NEW: Use typing effect for AI messages that are currently typing */}
                {!message.isUser && typingMessageId === message.id ? (
                  <TypingEffect 
                    text={message.text} 
                    onComplete={() => setTypingMessageId(null)}
                  />
                ) : (
                  <p>{message.text}</p>
                )}
                <span className={styles.timestamp}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
                
                {/* Show missing tool message */}
                {message.missingTool && (
                  <div className={styles.missingToolSection}>
                    <div className={styles.missingToolCard}>
                      <h3>🚀 Coming Soon!</h3>
                      <p>We don&apos;t have <strong>{message.missingTool}</strong> in our database yet, but we&apos;ll be adding it soon!</p>
                      <div className={styles.missingToolActions}>
                        <span>💡 In the meantime, try searching for similar tools or browse our categories.</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Show missing category message */}
                {message.missingCategory && (
                  <div className={styles.missingToolSection}>
                    <div className={styles.missingToolCard}>
                      <h3>🚀 Coming Soon!</h3>
                      <p>We don&apos;t have <strong>{message.missingCategory}</strong> tools in our database yet, but we&apos;ll be adding them soon!</p>
                      <div className={styles.missingToolActions}>
                        <span>💡 In the meantime, try searching for specific tool names or browse our existing categories.</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Show inappropriate content warning */}
                {message.text.toLowerCase().includes('cannot help you with') && !message.tools?.length && (
                  <div className={styles.inappropriateContentSection}>
                    <div className={styles.inappropriateContentCard}>
                      <h3>🚫 Content Policy</h3>
                      <p>I&apos;m designed to help with legitimate AI tool searches and recommendations only.</p>
                      <div className={styles.inappropriateContentActions}>
                        <span>💡 Try asking about legal and ethical AI tools that can help with your legitimate needs.</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* ✅ NEW: Only show tools section after typing is complete */}
                {message.tools && message.tools.length > 0 && typingMessageId !== message.id && (
                  <div className={styles.toolsSection}>
                    {message.isExactMatch && message.tools.length > 1 ? (
                      <>
                        {/* Case 1: Exact tool + category tools */}
                        <h3>🎯 Found Tool:</h3>
                        <div className={styles.toolsGrid} data-testid="tools-grid">
                          <div key={`${message.tools[0].id}-exact`} className={`${styles.toolCard} ${styles.exactToolCard}`} data-testid="tool-card">
                            <div className={styles.toolHeader}>
                              {message.tools[0].logoUrl ? (
                                <Image 
                                  src={message.tools[0].logoUrl} 
                                  alt={message.tools[0].title}
                                  width={40}
                                  height={40}
                                  className={styles.toolLogo}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className={styles.toolLogoPlaceholder}>
                                  {message.tools[0].title.charAt(0)}
                                </div>
                              )}
                              <div className={styles.toolInfo}>
                                <h4 data-testid="tool-title">{message.tools[0].title}</h4>
                                <span className={styles.exactMatchBadge}>Exact Match</span>
                              </div>
                            </div>
                            {message.tools[0].about && (
                              <div className={styles.toolAbout}>
                                <p>{message.tools[0].about}</p>
                              </div>
                            )}
                            <div className={styles.toolActions}>
                              <LikeButton 
                                toolId={message.tools[0].id}
                                initialLikeCount={message.tools[0].likeCount}
                                className={styles.actionButton}
                                data-testid="like-button"
                              />
                              {message.tools[0].toolType !== 'downloadable' && (
                                <SaveButton 
                                  toolId={message.tools[0].id}
                                  toolTitle={message.tools[0].title}
                                  initialSaveCount={message.tools[0].saveCount}
                                  className={styles.actionButton}
                                  data-testid="save-button"
                                />
                              )}
                              <VisitButton 
                                toolId={message.tools[0].id}
                                toolTitle={message.tools[0].title}
                                logoUrl={message.tools[0].logoUrl}
                                websiteUrl={message.tools[0].websiteUrl}
                                className={styles.actionButton}
                                data-testid="visit-button"
                              >
                                {message.tools[0].toolType === 'downloadable' ? '📥 Visit to Download' : '🌐 Visit'}
                              </VisitButton>
                            </div>
                          </div>
                        </div>
                        
                        <h3>🔄 Similar Tools from Same Category:</h3>
                        <div className={styles.toolsGrid} data-testid="tools-grid">
                          {message.tools.slice(1).map((tool, index) => (
                            <div key={`${tool.id}-${index}`} className={styles.toolCard} data-testid="tool-card">
                              <div className={styles.toolHeader}>
                                {tool.logoUrl ? (
                                  <Image 
                                    src={tool.logoUrl} 
                                    alt={tool.title}
                                    width={40}
                                    height={40}
                                    className={styles.toolLogo}
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className={styles.toolLogoPlaceholder}>
                                    {tool.title.charAt(0)}
                                  </div>
                                )}
                                <div className={styles.toolInfo}>
                                  <h4 data-testid="tool-title">{tool.title}</h4>
                                </div>
                              </div>
                              {tool.about && (
                                <div className={styles.toolAbout}>
                                  <p>{tool.about}</p>
                                </div>
                              )}
                              <div className={styles.toolActions}>
                                <LikeButton 
                                  toolId={tool.id}
                                  initialLikeCount={tool.likeCount}
                                  className={styles.actionButton}
                                />
                                {tool.toolType !== 'downloadable' && (
                                  <SaveButton 
                                    toolId={tool.id}
                                    toolTitle={tool.title}
                                    initialSaveCount={tool.saveCount}
                                    className={styles.actionButton}
                                  />
                                )}
                                <VisitButton 
                                  toolId={tool.id}
                                  toolTitle={tool.title}
                                  logoUrl={tool.logoUrl}
                                  websiteUrl={tool.websiteUrl}
                                  className={styles.actionButton}
                                >
                                  {tool.toolType === 'downloadable' ? '📥 Visit to Download' : '🌐 Visit'}
                                </VisitButton>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Case 2: General keyword search - top 3 tools */}
                        <h3>🎯 Recommended Tools:</h3>
                                              <div className={styles.toolsGrid} data-testid="tools-grid">
                        {message.tools.map((tool, index) => (
                          <div key={`${tool.id}-${index}`} className={styles.toolCard} data-testid="tool-card">
                              <div className={styles.toolHeader}>
                                {tool.logoUrl ? (
                                  <Image 
                                    src={tool.logoUrl} 
                                    alt={tool.title}
                                    width={40}
                                    height={40}
                                    className={styles.toolLogo}
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className={styles.toolLogoPlaceholder}>
                                    {tool.title.charAt(0)}
                                  </div>
                                )}
                                <div className={styles.toolInfo}>
                                  <h4>{tool.title}</h4>
                                </div>
                              </div>
                              {tool.about && (
                                <div className={styles.toolAbout}>
                                  <p>{tool.about}</p>
                                </div>
                              )}
                              <div className={styles.toolActions}>
                                <LikeButton 
                                  toolId={tool.id}
                                  initialLikeCount={tool.likeCount}
                                  className={styles.actionButton}
                                />
                                {tool.toolType !== 'downloadable' && (
                                  <SaveButton 
                                    toolId={tool.id}
                                    toolTitle={tool.title}
                                    initialSaveCount={tool.saveCount}
                                    className={styles.actionButton}
                                  />
                                )}
                                <VisitButton 
                                  toolId={tool.id}
                                  toolTitle={tool.title}
                                  logoUrl={tool.logoUrl}
                                  websiteUrl={tool.websiteUrl}
                                  className={styles.actionButton}
                                >
                                  {tool.toolType === 'downloadable' ? '📥 Visit to Download' : '🌐 Visit'}
                                </VisitButton>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {message.moreLink && (
                      <div className={styles.moreLink}>
                        <a href={message.moreLink} className={styles.moreButton}>
                          View More Tools →
                        </a>
                      </div>
                    )}
                  </div>
                )}
                

              </div>
            </div>
          ))}

          {isClient && isLoading && (
            <div className={`${styles.message} ${styles.aiMessage}`}>
              <div className={styles.messageContent}>
                <div className={styles.loading}>
                  <div className={styles.loadingDots}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span>Finding the best tools for you...</span>
                </div>
              </div>
            </div>
          )}

          {isClient && error && (
            <div className={`${styles.message} ${styles.errorMessage}`}>
              <div className={styles.messageContent}>
                <p>❌ Error: {error}</p>
              </div>
            </div>
          )}
          
          {/* ✅ FIXED: Invisible element for auto-scrolling within container */}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.inputContainer}>
          <div className={styles.inputWrapper}>
          <button
              onClick={() => setShowComplaintModal(true)}
              disabled={isLoading}
              className={styles.complaintButton}
              title="Report an issue or complaint"
            >
              🚨
            </button>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe what you need AI tools for..."
              disabled={isLoading}
              className={styles.input}
              rows={1}
              data-testid="chat-input"
            />
            {/* <button
              onClick={() => setShowComplaintModal(true)}
              disabled={isLoading}
              className={styles.complaintButton}
              title="Report an issue or complaint"
            >
              🚨
            </button> */}
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputText.trim()}
              className={styles.sendButton}
              data-testid="send-button"
            >
              {isLoading ? '⏳' : '📤'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Complaint Modal */}
      {showComplaintModal && (
        <div className={styles.modalOverlay} onClick={() => setShowComplaintModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>🚨 Report Issue or Complaint</h3>
              <button 
                onClick={() => setShowComplaintModal(false)}
                className={styles.closeButton}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <textarea
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder="Please describe your issue or complaint..."
                className={styles.complaintTextarea}
                rows={5}
                maxLength={5000}
                disabled={isSubmittingComplaint}
              />
              <div className={styles.characterCount}>
                {complaintText.length}/5000 characters
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                onClick={() => setShowComplaintModal(false)}
                className={styles.cancelButton}
                disabled={isSubmittingComplaint}
              >
                Cancel
              </button>
              <button
                onClick={handleComplaintSubmit}
                disabled={isSubmittingComplaint || !complaintText.trim()}
                className={styles.submitButton}
              >
                {isSubmittingComplaint ? 'Submitting...' : 'Submit Complaint'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClearChat={handleClearChat}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
} 