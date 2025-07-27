import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { OptimizedLikeButton, OptimizedSaveButton, VisitButton, AboutButton } from '@/components/S-components';

interface ToolCardProps {
  id: string;
  title: string;
  logoUrl: string;
  websiteUrl: string;
  category: string;
  toolType?: 'browser' | 'downloadable';
  likeCount: number;
  saveCount: number;
  about?: string;
}

const SSRToolCard = ({ id, title, logoUrl, websiteUrl, likeCount, saveCount, about }: ToolCardProps) => {
  return (
    <StyledWrapper>
      <motion.div
        className="tool-item"
        initial={{ scale: 0.7, opacity: 0, x: -50 }}
        animate={{ scale: 1, opacity: 1, x: 0 }}
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
            <h3 className="tool-title">{title}</h3>
          </div>
          
          <div className="action-buttons">
            <OptimizedLikeButton 
              toolId={id}
              initialLikeCount={likeCount}
            />
            <OptimizedSaveButton 
              toolId={id}
              toolTitle={title}
              initialSaveCount={saveCount}
            />
            <AboutButton 
              toolTitle={title}
              about={about}
            />
            <VisitButton 
              toolId={id}
              toolTitle={title}
              logoUrl={logoUrl}
              websiteUrl={websiteUrl}
            />
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

  .item-front {
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
    border: 1px solid rgb(254, 253, 253);
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

    .action-buttons {
      gap: 6px;
    }
  }

  @media (max-width: 480px) {
    .tool-item {
      height: 90px;
    }

    .item-front {
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

    .action-buttons {
      gap: 4px;
    }
  }
`;

export default SSRToolCard; 