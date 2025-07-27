'use client';
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAlert } from '@/components/B-components/alert/AlertContext';
import { useUser } from '@clerk/nextjs';

interface SubscriptionData {
  isSubscribed: boolean;
  planAmount: number;
  toolLimit: number;
  folderLimit: number;
  totalSavedTools: number;
  currentFolders: number;
  canSaveMoreTools: boolean;
  canCreateMoreFolders: boolean;
}

const SubscriptionInfo: React.FC = () => {
  const { showSuccess, showError } = useAlert();
  const { isSignedIn, isLoaded } = useUser();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchSubscription();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/user/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      } else {
        console.error('Failed to fetch subscription');
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planAmount: number) => {
    if (!isSignedIn) {
      showError('Please sign in to upgrade your subscription');
      return;
    }

    setUpgrading(true);
    try {
      const response = await fetch('/api/user/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planAmount }),
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
        showSuccess(`Successfully upgraded to $${planAmount} plan!`);
        fetchSubscription(); // Refresh data
      } else {
        const errorData = await response.json();
        showError(errorData.error || 'Failed to upgrade subscription');
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      showError('Failed to upgrade subscription');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <SubscriptionContainer>
        <LoadingText>Loading subscription info...</LoadingText>
      </SubscriptionContainer>
    );
  }

  if (!isSignedIn) {
    return (
      <SubscriptionContainer>
        <LoadingText>Please sign in to view subscription information</LoadingText>
      </SubscriptionContainer>
    );
  }

  if (!subscription) {
    return null;
  }

  const toolUsage = subscription.totalSavedTools || 0;
  const toolLimit = subscription.toolLimit || 1; // Avoid division by zero
  const toolUsagePercent = toolLimit > 0 ? (toolUsage / toolLimit) * 100 : 0;

  const folderUsage = subscription.currentFolders || 0;
  const folderLimit = subscription.folderLimit || 1; // Avoid division by zero
  const folderUsagePercent = folderLimit > 0 ? (folderUsage / folderLimit) * 100 : 0;

  return (
    <SubscriptionContainer>
      <SubscriptionHeader>
        <SubscriptionTitle>
          {subscription.isSubscribed ? '💰 Premium Balance' : '🔓 Free Plan'}
        </SubscriptionTitle>
        {subscription.isSubscribed && (
          <PlanAmount>${subscription.planAmount} total paid</PlanAmount>
        )}
      </SubscriptionHeader>

      <UsageSection>
        <UsageItem>
          <UsageLabel>Tools Saved</UsageLabel>
          <UsageBar>
                            <UsageFill
                  $percent={isNaN(toolUsagePercent) ? 0 : Math.min(toolUsagePercent, 100)}
                  $color={toolUsagePercent > 80 ? '#ef4444' : toolUsagePercent > 60 ? '#f59e0b' : '#10b981'}
                />
          </UsageBar>
          <UsageText>
            {toolUsage} / {toolLimit} tools
          </UsageText>
        </UsageItem>

        <UsageItem>
          <UsageLabel>Folders Created</UsageLabel>
          <UsageBar>
                            <UsageFill
                  $percent={isNaN(folderUsagePercent) ? 0 : Math.min(folderUsagePercent, 100)}
                  $color={folderUsagePercent > 80 ? '#ef4444' : folderUsagePercent > 60 ? '#f59e0b' : '#10b981'}
                />
          </UsageBar>
          <UsageText>
            {folderUsage} / {folderLimit} folders
          </UsageText>
        </UsageItem>
      </UsageSection>

      {!subscription.canSaveMoreTools && (
        <LimitWarning>
          ⚠️ You&apos;ve reached your tool limit! Upgrade to save more tools.
        </LimitWarning>
      )}

      {!subscription.canCreateMoreFolders && (
        <LimitWarning>
          ⚠️ You&apos;ve reached your folder limit! Upgrade to create more folders.
        </LimitWarning>
      )}

      {!subscription.isSubscribed && (
        <UpgradeSection>
          <UpgradeTitle>🎉 Buy More Space</UpgradeTitle>
          <UpgradeDescription>
            <strong>PAY-AS-YOU-NEED!</strong> Buy $1 packs whenever you need more space:
          </UpgradeDescription>
          
          <UpgradeOptions>
            <UpgradeOption>
              <UpgradeAmount>$1</UpgradeAmount>
              <UpgradeDetails>
                <div>+10 tools</div>
                <div>+1 folder</div>
                <div><em>Buy anytime</em></div>
              </UpgradeDetails>
              <UpgradeButton 
                onClick={() => handleUpgrade(1)}
                disabled={upgrading}
              >
                {upgrading ? 'Buying...' : 'Buy Pack'}
              </UpgradeButton>
            </UpgradeOption>

            <UpgradeOption>
              <UpgradeAmount>$2</UpgradeAmount>
              <UpgradeDetails>
                <div>+20 tools</div>
                <div>+2 folders</div>
                <div><em>Buy anytime</em></div>
              </UpgradeDetails>
              <UpgradeButton 
                onClick={() => handleUpgrade(2)}
                disabled={upgrading}
              >
                {upgrading ? 'Buying...' : 'Buy 2 Packs'}
              </UpgradeButton>
            </UpgradeOption>

            <UpgradeOption>
              <UpgradeAmount>$3</UpgradeAmount>
              <UpgradeDetails>
                <div>+30 tools</div>
                <div>+3 folders</div>
                <div><em>Buy anytime</em></div>
              </UpgradeDetails>
              <UpgradeButton 
                onClick={() => handleUpgrade(3)}
                disabled={upgrading}
              >
                {upgrading ? 'Buying...' : 'Buy 3 Packs'}
              </UpgradeButton>
            </UpgradeOption>
          </UpgradeOptions>
        </UpgradeSection>
      )}

      {subscription.isSubscribed && (
        <CurrentPlanInfo>
          <PlanInfoTitle>Current Benefits</PlanInfoTitle>
          <PlanInfoDetails>
            <div>✅ {toolLimit} tools allowed</div>
            <div>✅ {folderLimit} folders allowed</div>
            <div>✅ 5 tools per folder</div>
            <div>✅ Priority support</div>
            <div>✅ Buy more packs anytime</div>
          </PlanInfoDetails>
        </CurrentPlanInfo>
      )}
    </SubscriptionContainer>
  );
};

const SubscriptionContainer = styled.div`
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  border: 1px solid #374151;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const SubscriptionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const SubscriptionTitle = styled.h3`
  color: #ffffff;
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
`;

const PlanAmount = styled.span`
  color: #10b981;
  font-weight: 600;
  font-size: 1rem;
`;

const UsageSection = styled.div`
  margin-bottom: 16px;
`;

const UsageItem = styled.div`
  margin-bottom: 12px;
`;

const UsageLabel = styled.div`
  color: #d1d5db;
  font-size: 0.875rem;
  margin-bottom: 4px;
`;

const UsageBar = styled.div`
  width: 100%;
  height: 8px;
  background: #374151;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
`;

const UsageFill = styled.div<{ $percent: number; $color: string }>`
  height: 100%;
  width: ${props => Math.min(props.$percent, 100)}%;
  background: ${props => props.$color};
  transition: width 0.3s ease;
`;

const UsageText = styled.div`
  color: #9ca3af;
  font-size: 0.75rem;
  text-align: right;
`;

const LimitWarning = styled.div`
  background: #dc2626;
  color: #ffffff;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.875rem;
  margin-bottom: 12px;
  text-align: center;
`;

const UpgradeSection = styled.div`
  border-top: 1px solid #374151;
  padding-top: 16px;
`;

const UpgradeTitle = styled.h4`
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const UpgradeDescription = styled.p`
  color: #9ca3af;
  font-size: 0.875rem;
  margin: 0 0 16px 0;
`;

const UpgradeOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
`;

const UpgradeOption = styled.div`
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
`;

const UpgradeAmount = styled.div`
  color: #10b981;
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 8px;
`;

const UpgradeDetails = styled.div`
  color: #d1d5db;
  font-size: 0.75rem;
  margin-bottom: 8px;
  
  div {
    margin-bottom: 2px;
  }
`;

const UpgradeButton = styled.button`
  background: #10b981;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  
  &:hover:not(:disabled) {
    background: #059669;
  }
  
  &:disabled {
    background: #6b7280;
    cursor: not-allowed;
  }
`;

const CurrentPlanInfo = styled.div`
  border-top: 1px solid #374151;
  padding-top: 16px;
`;

const PlanInfoTitle = styled.h4`
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const PlanInfoDetails = styled.div`
  color: #d1d5db;
  font-size: 0.875rem;
  
  div {
    margin-bottom: 4px;
  }
`;

const LoadingText = styled.div`
  color: #9ca3af;
  text-align: center;
  padding: 20px;
`;

export default SubscriptionInfo; 