'use client';
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';


interface StatsData {
  userCount: number;
  categoryCount: number;
  toolCount: number;
}

const AboutPage = () => {
  const [stats, setStats] = useState<StatsData>({
    userCount: 0,
    categoryCount: 0,
    toolCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('Fetching stats...');
        const response = await fetch('/api/stats');
        console.log('Stats response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Stats data:', data);
          setStats({
            userCount: data.userCount || 0,
            categoryCount: data.categoryCount || 0,
            toolCount: data.toolCount || 0
          });
        } else {
          const errorData = await response.json();
          console.error('Stats API error:', errorData);
          // Set fallback values
          setStats({
            userCount: 0,
            categoryCount: 0,
            toolCount: 0
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return null;
  }

  return (
    <Container>
      <Header>
        <Title> Platform Statistics</Title>
        <Subtitle>Real-time insights into our registered users and tools</Subtitle>
      </Header>

      <StatsGrid>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <StatsCard
            title="Registered Users"
            value={stats.userCount}
            suffix="users"
            description="Total users who have registered on our platform"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <StatsCard
            title="Categories"
            value={stats.categoryCount}
            suffix="categories"
            description="AI tool categories available"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <StatsCard
            title="AI Tools"
            value={stats.toolCount}
            suffix="tools"
            description="Total AI tools in our collection"
          />
        </motion.div>
      </StatsGrid>

      <AboutSection>
        <AboutTitle>About Our Platform</AboutTitle>
        <AboutContent>
          <p>
            We&apos;re building the ultimate AI tools discovery platform, helping users find and organize 
            the best AI-powered applications for their needs. Our platform features a comprehensive 
            collection of AI tools across various categories, from productivity to creativity.
          </p>
          <p>
            With our micro top-up system, users can grow their tool collection as their needs evolve, 
            ensuring they only pay for what they actually use. Join thousands of users who are already 
            discovering and organizing their favorite AI tools with us.
          </p>
        </AboutContent>
      </AboutSection>
    </Container>
  );
};

interface StatsCardProps {
  title: string;
  value: number;
  suffix: string;
  description: string;
}

const StatsCard = ({ title, value, suffix, description }: StatsCardProps) => {
  return (
    <StyledWrapper>
      <div className="outer">
        <div className="dot" />
        <div className="card">
          <div className="ray" />
          <div className="text">{value.toLocaleString()}</div>
          <div className="suffix">{suffix}</div>
          <div className="title">{title}</div>
          <div className="description">{description}</div>
          <div className="line topl" />
          <div className="line leftl" />
          <div className="line bottoml" />
          <div className="line rightl" />
        </div>
      </div>
    </StyledWrapper>
  );
};

const Container = styled.div`
  max-width: 95%;
    margin: 0 auto;
    padding: 0rem;
    min-height: 100vh;
    color: #000000;
    
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  margin-top: 2rem;
  margin-bottom: 1rem;
  background: linear-gradient(135deg,rgb(0, 0, 0) 0%,rgb(255, 255, 255) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  color:rgb(255, 255, 255);
  margin: 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
  justify-items: center;
  align-items: center;
`;

const AboutSection = styled.div`
  background: linear-gradient(135deg,rgb(0, 0, 0) 0%,rgb(0, 0, 0) 100%);
  border-radius: 20px;
  padding: 2rem;
  border: 1px solid #4b5563;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
  margin-bottom: 2rem;
`;

const AboutTitle = styled.h2`
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #10b981;
`;

const AboutContent = styled.div`
  p {
    font-size: 1.1rem;
    line-height: 1.7;
    color: #d1d5db;
    margin-bottom: 1rem;
  }
`;



const StyledWrapper = styled.div`
  .outer {
    width: 300px;
    height: 250px;
    border-radius: 10px;
    padding: 1px;
    background: radial-gradient(circle 230px at 0% 0%, #ffffff, #0c0d0d);
    position: relative;
  }

  .dot {
    width: 5px;
    aspect-ratio: 1;
    position: absolute;
    background-color: #fff;
    box-shadow: 0 0 10px #ffffff;
    border-radius: 100px;
    z-index: 2;
    right: 10%;
    top: 10%;
    animation: moveDot 6s linear infinite;
  }

  @keyframes moveDot {
    0%,
    100% {
      top: 10%;
      right: 10%;
    }
    25% {
      top: 10%;
      right: calc(100% - 35px);
    }
    50% {
      top: calc(100% - 30px);
      right: calc(100% - 35px);
    }
    75% {
      top: calc(100% - 30px);
      right: 10%;
    }
  }

  .card {
    z-index: 1;
    width: 100%;
    height: 100%;
    border-radius: 9px;
    border: solid 1px #202222;
    background-size: 20px 20px;
    background: radial-gradient(circle 280px at 0% 0%, #444444, #0c0d0d);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    flex-direction: column;
    color: #fff;
  }

  .ray {
    width: 220px;
    height: 45px;
    border-radius: 100px;
    position: absolute;
    background-color: #c7c7c7;
    opacity: 0.4;
    box-shadow: 0 0 50px #fff;
    filter: blur(10px);
    transform-origin: 10%;
    top: 0%;
    left: 0;
    transform: rotate(40deg);
  }

  .card .text {
    font-weight: bolder;
    font-size: 3rem;
    background: linear-gradient(45deg, #000000 4%, #fff, #000);
    background-clip: text;
    color: transparent;
    margin-bottom: 0.5rem;
  }

  .suffix {
    font-size: 1rem;
    color: #94a3b8;
    margin-bottom: 0.5rem;
  }

  .title {
    font-size: 1.2rem;
    font-weight: 600;
    color: #10b981;
    margin-bottom: 0.5rem;
  }

  .description {
    font-size: 0.9rem;
    color: #9ca3af;
    text-align: center;
    max-width: 200px;
  }

  .line {
    width: 100%;
    height: 1px;
    position: absolute;
    background-color: #2c2c2c;
  }

  .topl {
    top: 10%;
    background: linear-gradient(90deg, #888888 30%, #1d1f1f 70%);
  }

  .bottoml {
    bottom: 10%;
  }

  .leftl {
    left: 10%;
    width: 1px;
    height: 100%;
    background: linear-gradient(180deg, #747474 30%, #222424 70%);
  }

  .rightl {
    right: 10%;
    width: 1px;
    height: 100%;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .outer {
      width: 280px;
      height: 230px;
    }

    .card .text {
      font-size: 2.5rem;
    }

    .title {
      font-size: 1.1rem;
    }

    .description {
      font-size: 0.8rem;
    }
  }

  @media (max-width: 480px) {
    .outer {
      width: 260px;
      height: 210px;
    }

    .card .text {
      font-size: 2rem;
    }

    .title {
      font-size: 1rem;
    }

    .description {
      font-size: 0.75rem;
    }
  }
`;

export default AboutPage; 