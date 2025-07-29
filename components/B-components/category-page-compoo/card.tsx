import Link from 'next/link';
import React from 'react';
import styled from 'styled-components';

interface Props {
  name: string;
  toolCount?: number;
  description?: string;
}

const CategoryCard = ({ name, toolCount = 0, description = "Explore amazing tools in this category" }: Props) => {
  return (
    <Link
      href={`/category/${encodeURIComponent(name.toLowerCase())}`}
      title={`Explore ${name} tools (${toolCount} available)`}
    >
      <StyledWrapper>
        <div className="card">
          <div className="card__front">
            <p className="card__title">{name}</p>
            <p className="card__tool-count">{toolCount} tool{toolCount !== 1 ? 's' : ''}</p>
          </div>
          <div className="card__content">
            <p className="card__description">{description}</p>
          </div>
        </div>
      </StyledWrapper>
    </Link>
  );
}

const StyledWrapper = styled.div`
  .card {
    position: relative;
    width: 100%;
    height: 160px;
    background-color: #f2f2f2;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    perspective: 1000px;
    box-shadow: 0 0 0 5px #ffffff80;
    transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    /* Ensure uniform size */
    min-width: 280px;
    max-width: 280px;
    min-height: 160px;
    max-height: 160px;
  }

  .card:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 16px rgba(255, 255, 255, 0.2);
  }

  .card__front {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    width: 100%;
    height: 100%;
    padding: 16px;
    box-sizing: border-box;
  }

  .card__content {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    padding: 16px;
    box-sizing: border-box;
    background-color: #f2f2f2;
    transform: rotateX(-90deg);
    transform-origin: bottom;
    transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .card:hover .card__content {
    transform: rotateX(0deg);
  }

  .card:hover .card__front {
    transform: rotateX(90deg);
  }

  .card__title {
    margin: 0;
    font-size: 20px;
    color: #333;
    font-weight: 700;
    line-height: 1.2;
    word-wrap: break-word;
    overflow-wrap: break-word;
    max-width: 100%;
  }

  .card__tool-count {
    margin: 8px 0 0;
    font-size: 14px;
    color: #666;
    font-weight: 500;
  }

  .card__description {
    margin: 0;
    font-size: 12px;
    color: #777;
    line-height: 1.4;
    word-wrap: break-word;
    overflow-wrap: break-word;
    max-width: 100%;
  }

  /* ===== RESPONSIVE DESIGN ===== */

  /* Large Desktop (1400px and up) */
  @media (min-width: 1400px) {
    .card {
      min-width: 320px;
      max-width: 320px;
      min-height: 180px;
      max-height: 180px;
    }

    .card__content {
      padding: 20px;
    }

    .card__title {
      font-size: 24px;
    }

    .card__tool-count {
      font-size: 16px;
    }

    .card__description {
      font-size: 14px;
    }
  }

  /* Desktop (1024px to 1399px) */
  @media (max-width: 1399px) and (min-width: 1024px) {
    .card {
      min-width: 280px;
      max-width: 280px;
      min-height: 160px;
      max-height: 160px;
    }

    .card__content {
      padding: 16px;
    }

    .card__title {
      font-size: 20px;
    }

    .card__tool-count {
      font-size: 14px;
    }

    .card__description {
      font-size: 12px;
    }
  }

  /* Tablet (768px to 1023px) */
  @media (max-width: 1023px) and (min-width: 768px) {
    .card {
      min-width: 260px;
      max-width: 260px;
      min-height: 150px;
      max-height: 150px;
    }

    .card__content {
      padding: 14px;
    }

    .card__title {
      font-size: 18px;
    }

    .card__tool-count {
      font-size: 13px;
    }

    .card__description {
      font-size: 11px;
    }
  }

  /* Mobile Large (481px to 767px) */
  @media (max-width: 767px) and (min-width: 481px) {
    .card {
      min-width: 240px;
      max-width: 240px;
      min-height: 140px;
      max-height: 140px;
    }

    .card__content {
      padding: 12px;
    }

    .card__title {
      font-size: 16px;
    }

    .card__tool-count {
      font-size: 12px;
    }

    .card__description {
      font-size: 10px;
    }
  }

  /* Mobile Small (320px to 480px) */
  @media (max-width: 480px) {
    .card {
      min-width: 280px;
      max-width: 280px;
      min-height: 160px;
      max-height: 160px;
    }

    .card__content {
      padding: 16px;
    }

    .card__title {
      font-size: 20px;
    }

    .card__tool-count {
      font-size: 14px;
    }

    .card__description {
      font-size: 12px;
    }
  }

  /* Extra Small Mobile (below 320px) */
  @media (max-width: 319px) {
    .card {
      min-width: 260px;
      max-width: 260px;
      min-height: 150px;
      max-height: 150px;
    }

    .card__content {
      padding: 14px;
    }

    .card__title {
      font-size: 18px;
    }

    .card__tool-count {
      font-size: 13px;
    }

    .card__description {
      font-size: 11px;
    }
  }
`;

export default CategoryCard;
