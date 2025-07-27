'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import styled from 'styled-components';
import { useAlert } from '@/components/B-components/alert/AlertContext';


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

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  key_id: string;
}

const PricingPage = () => {
  const { isSignedIn } = useAuth();
  const { showSuccess, showError } = useAlert();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<number>(1);

  useEffect(() => {
    if (isSignedIn) {
      fetchSubscription();
    } else {
      setLoading(false);
    }
  }, [isSignedIn]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

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

  const handleUpgrade = async () => {
    if (!isSignedIn) {
      showError('Please sign in to purchase packs');
      return;
    }

    setUpgrading(true);
    try {
      // Create Razorpay order
      const orderResponse = await fetch('/api/user/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planAmount: selectedPlan }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const orderData = await orderResponse.json();
      const order: RazorpayOrder = orderData.order;

      // Initialize Razorpay payment
      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'AI Finder',
        description: `${selectedPlan} Pack${selectedPlan > 1 ? 's' : ''} - Extra Tools & Folders`,
        order_id: order.id,
        handler: async function (response: Record<string, unknown>) {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/user/subscription/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planAmount: selectedPlan,
              }),
            });

            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json();
              setSubscription(verifyData.subscription);
              showSuccess(`Successfully purchased ${selectedPlan} pack${selectedPlan > 1 ? 's' : ''} for $${selectedPlan}!`);
            } else {
              const errorData = await verifyResponse.json();
              showError(errorData.error || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            showError('Payment verification failed');
          }
        },
        prefill: {
          name: 'User',
          email: '',
        },
        theme: {
          color: '#10b981',
        },
        modal: {
          ondismiss: function() {
            setUpgrading(false);
          }
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Error creating order:', error);
      showError(error instanceof Error ? error.message : 'Failed to create order');
      setUpgrading(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <Container>
      <Header>
        <Title>🚀 Upgrade Your Experience</Title>
        <Subtitle>Unlock unlimited potential with our flexible pricing</Subtitle>
      </Header>

      {/* Current Plan Section */}
      {isSignedIn && subscription && (
        <CurrentPlanSection>
          <CurrentPlanHeader>
            <PlanIcon>👑</PlanIcon>
            <div>
              <CurrentPlanTitle>
                Current Balance: ${subscription.planAmount === 0 ? 'Free' : subscription.planAmount} (${subscription.planAmount * 10} extra tools, ${subscription.planAmount} extra folders)
              </CurrentPlanTitle>
              <CurrentPlanSubtitle>
                {subscription.planAmount === 0 ? 'Basic access' : `Total paid: $${subscription.planAmount} - Buy more packs anytime!`}
              </CurrentPlanSubtitle>
            </div>
          </CurrentPlanHeader>

          <UsageGrid>
            <UsageCard>
              <UsageHeader>
                <UsageIcon>🛠️</UsageIcon>
                <UsageTitle>Tools Saved</UsageTitle>
              </UsageHeader>
              <UsageValue>
                {subscription.totalSavedTools} / {subscription.toolLimit}
              </UsageValue>
              <ProgressBar>
                <ProgressFill 
                  $percent={
                    subscription.toolLimit && subscription.toolLimit > 0 && subscription.totalSavedTools !== undefined
                      ? (() => {
                          const calculatedPercent = (subscription.totalSavedTools / subscription.toolLimit) * 100;
                          return isNaN(calculatedPercent) ? 0 : Math.min(calculatedPercent, 100);
                        })()
                      : 0
                  }
                  $color={
                    subscription.toolLimit && subscription.toolLimit > 0 && subscription.totalSavedTools !== undefined
                      ? (subscription.totalSavedTools / subscription.toolLimit) > 0.8
                        ? '#ef4444'
                        : (subscription.totalSavedTools / subscription.toolLimit) > 0.6
                          ? '#f59e0b'
                          : '#10b981'
                      : '#10b981'
                  }
                />
              </ProgressBar>
            </UsageCard>

            <UsageCard>
              <UsageHeader>
                <UsageIcon>📁</UsageIcon>
                <UsageTitle>Folders Created</UsageTitle>
              </UsageHeader>
              <UsageValue>
                {subscription.currentFolders} / {subscription.folderLimit}
              </UsageValue>
              <ProgressBar>
                <ProgressFill 
                  $percent={
                    subscription.folderLimit && subscription.folderLimit > 0 && subscription.currentFolders !== undefined
                      ? (() => {
                          const calculatedPercent = (subscription.currentFolders / subscription.folderLimit) * 100;
                          return isNaN(calculatedPercent) ? 0 : Math.min(calculatedPercent, 100);
                        })()
                      : 0
                  }
                  $color={
                    subscription.folderLimit && subscription.folderLimit > 0 && subscription.currentFolders !== undefined
                      ? (subscription.currentFolders / subscription.folderLimit) > 0.8
                        ? '#ef4444'
                        : (subscription.currentFolders / subscription.folderLimit) > 0.6
                          ? '#f59e0b'
                          : '#10b981'
                      : '#10b981'
                  }
                />
              </ProgressBar>
            </UsageCard>
          </UsageGrid>

          {(!subscription.canSaveMoreTools || !subscription.canCreateMoreFolders) && (
            <LimitWarning>
              ⚠️ You&apos;ve reached some limits! Upgrade to unlock more tools and folders.
            </LimitWarning>
          )}
        </CurrentPlanSection>
      )}

      {/* Upgrade Section */}
      <UpgradeSection>
        <UpgradeHeader>
          <UpgradeTitle>💎 Micro Top-Up System</UpgradeTitle>
          <UpgradeSubtitle>
            <strong>PAY-AS-YOU-NEED!</strong> Buy $1 packs whenever you need more space. Each $1 gives you +10 tools and +1 folder.
          </UpgradeSubtitle>
        </UpgradeHeader>

        <PlanSelector>
          <PlanSelectorLabel>How many $1 packs do you want to buy?</PlanSelectorLabel>
          <PlanStepper>
            <StepperButton 
              disabled={selectedPlan === 1} 
              onClick={() => setSelectedPlan(prev => Math.max(1, prev - 1))}
            >
              <span>−</span>
            </StepperButton>
            <PlanAmount>{selectedPlan} pack{selectedPlan > 1 ? 's' : ''} (${selectedPlan})</PlanAmount>
            <StepperButton onClick={() => setSelectedPlan(prev => prev + 1)}>
              <span>+</span>
            </StepperButton>
          </PlanStepper>
        </PlanSelector>

        <PlanPreview>
          <PreviewHeader>📋 Pack Preview</PreviewHeader>
          <PreviewGrid>
            <PreviewCard>
              <PreviewIcon>🛠️</PreviewIcon>
              <PreviewTitle>Extra Tools</PreviewTitle>
              <PreviewValue>+{selectedPlan * 10}</PreviewValue>
              <PreviewDescription>Additional AI tools you can save</PreviewDescription>
            </PreviewCard>
            <PreviewCard>
              <PreviewIcon>📁</PreviewIcon>
              <PreviewTitle>Extra Folders</PreviewTitle>
              <PreviewValue>+{selectedPlan}</PreviewValue>
              <PreviewDescription>Additional folders you can create</PreviewDescription>
            </PreviewCard>
          </PreviewGrid>
        </PlanPreview>

        <UpgradeInfo>
          <p><strong>🎉 MICRO TOP-UP BENEFITS:</strong></p>
          <ul>
            <li><strong>+{selectedPlan * 10} extra tools</strong> (on top of your current limit)</li>
            <li><strong>+{selectedPlan} extra folders</strong> (on top of your current limit)</li>
            <li><strong>Buy anytime</strong> - Purchase more packs whenever you need them</li>
            <li><strong>Instant activation</strong> - Benefits available immediately</li>
            <li><strong>No subscription</strong> - Pay only when you need more space</li>
          </ul>
        </UpgradeInfo>

        <UpgradeButton 
          disabled={upgrading} 
          onClick={handleUpgrade}
        >
          {upgrading ? (
            <>
              <Spinner />
              Creating Order...
            </>
          ) : (
            `Buy ${selectedPlan} Pack${selectedPlan > 1 ? 's' : ''} - $${selectedPlan}`
          )}
        </UpgradeButton>
      </UpgradeSection>

      {/* Features Section */}
      <FeaturesSection>
        <FeaturesTitle>✨ Why Choose Micro Top-Ups?</FeaturesTitle>
        <FeaturesGrid>
          <FeatureCard>
            <FeatureIcon>🎯</FeatureIcon>
            <FeatureTitle>Pay As You Need</FeatureTitle>
            <FeatureDescription>Only pay when you actually need more space</FeatureDescription>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon>⚡</FeatureIcon>
            <FeatureTitle>Instant Activation</FeatureTitle>
            <FeatureDescription>Get your new limits immediately after payment</FeatureDescription>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon>💰</FeatureIcon>
            <FeatureTitle>No Waste</FeatureTitle>
            <FeatureDescription>No unused subscription - buy only what you need</FeatureDescription>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon>🔄</FeatureIcon>
            <FeatureTitle>Flexible Growth</FeatureTitle>
            <FeatureDescription>Grow your limits gradually as your needs grow</FeatureDescription>
          </FeatureCard>
        </FeaturesGrid>
      </FeaturesSection>
    </Container>
  );
};

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #ffffff;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  color: #94a3b8;
  margin: 0;
`;



const CurrentPlanSection = styled.div`
  background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 3rem;
  border: 1px solid #4b5563;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
`;

const CurrentPlanHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const PlanIcon = styled.div`
  font-size: 2rem;
`;

const CurrentPlanTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: #10b981;
`;

const CurrentPlanSubtitle = styled.p`
  font-size: 0.875rem;
  color: #9ca3af;
  margin: 0;
`;

const UsageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1rem;
`;

const UsageCard = styled.div`
  background: #111827;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #374151;
`;

const UsageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const UsageIcon = styled.div`
  font-size: 1.5rem;
`;

const UsageTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: #d1d5db;
`;

const UsageValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.75rem;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #374151;
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $percent: number; $color: string }>`
  height: 100%;
  width: ${props => Math.min(props.$percent, 100)}%;
  background: ${props => props.$color};
  transition: width 0.3s ease;
  border-radius: 4px;
`;

const LimitWarning = styled.div`
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: #ffffff;
  padding: 1rem;
  border-radius: 12px;
  text-align: center;
  font-weight: 500;
  margin-top: 1rem;
`;

const UpgradeSection = styled.div`
  background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 3rem;
  border: 1px solid #4b5563;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
`;

const UpgradeHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const UpgradeTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const UpgradeSubtitle = styled.p`
  font-size: 1rem;
  color: #9ca3af;
  margin: 0;
`;

const PlanSelector = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const PlanSelectorLabel = styled.label`
  font-size: 1rem;
  font-weight: 500;
  color: #d1d5db;
`;

const PlanStepper = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background: #111827;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  border: 1px solid #374151;
`;

const StepperButton = styled.button`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
  border: none;
  color: white;
  cursor: pointer;
  border-radius: 8px;
  font-size: 1.5rem;
  font-weight: 600;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #4b5563 0%, #6b7280 100%);
    transform: scale(1.05);
  }

  &:disabled {
    background: #1f2937;
    color: #6b7280;
    cursor: not-allowed;
  }
`;

const PlanAmount = styled.span`
  font-size: 2rem;
  font-weight: 700;
  color: #10b981;
  min-width: 60px;
  text-align: center;
`;

const PlanPreview = styled.div`
  background: #111827;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid #374151;
`;

const PreviewHeader = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  text-align: center;
  color: #d1d5db;
`;

const PreviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const PreviewCard = styled.div`
  background: #1f2937;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  border: 1px solid #374151;
`;

const PreviewIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`;

const PreviewTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 500;
  color: #9ca3af;
  margin: 0 0 0.5rem 0;
`;

const PreviewValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #10b981;
  margin-bottom: 0.25rem;
`;

const PreviewDescription = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
`;

const UpgradeInfo = styled.div`
  background: #111827;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid #374151;
`;

const UpgradeButton = styled.button`
  width: 100%;
  padding: 1rem 2rem;
  font-size: 1.125rem;
  font-weight: 600;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    transform: translateY(-2px);
    box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.3);
  }

  &:disabled {
    background: #374151;
    color: #6b7280;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const Spinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
`;

const FeaturesSection = styled.div`
  text-align: center;
`;

const FeaturesTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 2rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
`;

const FeatureCard = styled.div`
  background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  transition: transform 0.3s ease;
  border: 1px solid #4b5563;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
  }
`;

const FeatureIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 1rem;
`;

const FeatureTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #ffffff;
`;

const FeatureDescription = styled.p`
  font-size: 0.875rem;
  color: #9ca3af;
  margin: 0;
  line-height: 1.5;
`;

export default PricingPage;
