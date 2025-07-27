'use client';
import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { motion, useInView } from 'framer-motion';
import Image from 'next/image';
import { LikeButton, DownloadButton } from './index';

interface DownloadableFlipCardProps {
  id: string;
  title: string;
  logoUrl: string;
  websiteUrl: string;
  category: string;
  likeCount: number;
  about?: string;
}

const DownloadableFlipCard: React.FC<DownloadableFlipCardProps> = ({ 
  id, 
  title, 
  logoUrl, 
  websiteUrl, 
  likeCount, 
  about 
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const inView = useInView(itemRef, { amount: 0.5, once: false });

  const handleAboutClick = () => {
    setIsFlipped(!isFlipped);
  };

  const handleDownloadClick = () => {
    window.open(websiteUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <StyledWrapper>
      <motion.div
        ref={itemRef}
        data-testid="tool-card"
        className={`tool-item ${isFlipped ? 'flipped' : ''}`}
        initial={{ scale: 0.7, opacity: 0, x: -50 }}
        animate={inView ? { scale: 1, opacity: 1, x: 0 } : { scale: 0.7, opacity: 0, x: -50 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Front Side - Tool Info and Actions */}
        <div className="item-front">
          <div className="tool-info">
            <div className="logo-container">
              <Image 
                src={logoUrl} 
                alt={title} 
                width={44}
                height={44}
                quality={100}
                unoptimized={true}
                className="tool-logo"
                style={{ objectFit: 'cover', borderRadius: '8px' }}
              />
            </div>
            <h3 className="tool-title" data-testid="tool-title">{title}</h3>
          </div>
          
          <div className="action-buttons">
            <LikeButton 
              toolId={id}
              initialLikeCount={likeCount}
            />
            <button 
              className="action-btn about-btn"
              onClick={handleAboutClick}
            >
              ℹ️ About
            </button>
            <DownloadButton 
              toolId={id}
              toolTitle={title}
              logoUrl={logoUrl}
              websiteUrl={websiteUrl}
            />
          </div>
        </div>

        {/* Back Side - About Description */}
        <div className="item-back">
          <h3 className="tool-title" data-testid="tool-title">{title}</h3>
          <p className="tool-description">
            {about || 'No description available for this tool.'}
          </p>
          <div className="back-actions">
            <button 
              className="action-btn back-btn"
              onClick={handleAboutClick}
            >
              ← Back
            </button>
            <button 
              className="action-btn download-btn-back"
              onClick={handleDownloadClick}
            >
              📥 Visit to Download
            </button>
          </div>
        </div>
      </motion.div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .tool-item {
    position: relative;
    width: 100%;
    max-width: 100%;
    height: 120px;
    margin-top: -50px;
    perspective: 1000px;
    cursor: pointer;
  }  

  .item-front,
  .item-back {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 65%;
    background: rgb(7, 7, 7);
    border-radius: 12px;
    padding: 16px 24px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transform-origin: center bottom;
    transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    backface-visibility: hidden;
    border: 1px solid rgb(254, 253, 253);
  }

  .item-front {
    transform: rotateX(0deg);
    z-index: 2;
    visibility: visible;
    opacity: 1;
  }

  .item-back {
    transform: rotateX(180deg);
    z-index: 1;
    visibility: hidden;
    opacity: 0;
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    align-items: center;
  }

  .tool-item.flipped .item-front {
    transform: rotateX(180deg);
    z-index: 1;
    visibility: hidden;
    opacity: 0;
  }

  .tool-item.flipped .item-back {
    transform: rotateX(0deg);
    z-index: 2;
    visibility: visible;
    opacity: 1;
  }

  /* Fix upside down text on back side */
  .item-back .tool-title,
  .item-back .tool-description,
  .item-back .back-actions {
    transform: rotateX(0deg);
  }

  .tool-info {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
  }

  .logo-container {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    border: 1px solid #000000;
  }

  .tool-logo {
    width: 44px;
    height: 44px;
    object-fit: cover;
    border-radius: 4px;
  }

  .tool-title {
    margin: 0;
    font-size: 18px;
    color: rgb(255, 255, 255);
    font-weight: bold;
    line-height: 1.3;
  }

  .action-buttons {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .action-btn {
    padding: 8px 12px;
    border: 1px solid #ffffff;
    border-radius: 6px;
    background: #000000;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 12px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 60px;
    justify-content: center;
  }

  .action-btn:hover {
    background: #3A2A4A;
    border-color: #4A3A5A;
    transform: translateY(-1px);
  }

  .action-btn.active {
    background: #4A3A5A;
    border-color: #5A4A6A;
  }

  .about-btn {
    background: #1E3A8A;
    border-color: #2563EB;
  }

  .about-btn:hover {
    background: #2563EB;
  }

  .tool-description {
    margin: 8px 35px;
    font-size: 14px;
    color: rgb(255, 255, 255);
    line-height: 1.5;
    flex: 1;
    overflow-y: auto;
    max-height: 60px;
  }

  .back-actions {
    display: flex;
    gap: 5px;
    flex-direction: column;
  }

  .back-btn {
    flex: 0;
    background: #374151;
    border-color: #4B5563;
  }

  .back-btn:hover {
    background: #4B5563;
  }

  .download-btn-back {
    flex: 0;
    background: #059669;
    border-color: #10B981;
  }

  .download-btn-back:hover {
    background: #10B981;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .tool-item {
      height: 100px;
      padding: 12px 16px;
    }

    .logo-container {
      width: 50px;
      height: 50px;
    }

    .tool-logo {
      width: 36px;
      height: 36px;
    }

    .tool-title {
      font-size: 16px;
    }

    .action-btn {
      padding: 6px 8px;
      font-size: 11px;
      min-width: 50px;
    }

    .action-buttons {
      gap: 6px;
    }
  }

  @media (max-width: 480px) {
    .tool-item {
      height: 90px;
    }

    .item-front,
    .item-back {
      padding: 12px;
    }

    .tool-info {
      gap: 12px;
    }

    .logo-container {
      width: 40px;
      height: 40px;
    }

    .tool-logo {
      width: 28px;
      height: 28px;
    }

    .tool-title {
      font-size: 14px;
    }

    .action-btn {
      padding: 4px 6px;
      font-size: 10px;
      min-width: 40px;
    }

    .action-buttons {
      gap: 4px;
    }
  }
`;

export default DownloadableFlipCard; 