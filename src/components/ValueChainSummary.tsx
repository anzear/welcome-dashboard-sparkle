import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, Sprout, TestTube, Box, TrendingUp, ChevronRight, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ValueChainSummaryProps {
  productName: string;
  onExpand: () => void;
  onCardClick?: (type: 'feedstock' | 'technology' | 'products' | 'market') => void;
}

type SignalType = 'positive' | 'neutral' | 'negative';

const ValueChainSummary = ({ productName, onExpand, onCardClick }: ValueChainSummaryProps) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  const summaryData = [
    {
      id: 'feedstock',
      title: 'Feedstock',
      icon: <Sprout className="w-5 h-5" />,
      signal: 'positive' as SignalType,
      total: 12,
      highlight: 'Multiple feedstock opportunities exist for polyphenol production across several industries, with diverse sources available for commercial applications.',
      bgClass: 'bg-green-50/50',
      borderClass: 'border-green-500',
      textClass: 'text-green-700',
      iconBgClass: 'bg-green-100',
      signalText: 'Positive signals',
    },
    {
      id: 'technology',
      title: 'Technology',
      icon: <TestTube className="w-5 h-5" />,
      signal: 'neutral' as SignalType,
      total: 8,
      highlight: 'Five valorisation technologies are ready for deployment (TRL 7–9). Others, while still in development, show strong potential for future market and professional applications.',
      bgClass: 'bg-blue-50/50',
      borderClass: 'border-blue-400',
      textClass: 'text-blue-700',
      iconBgClass: 'bg-blue-100',
      signalText: 'Mixed signals',
    },
    {
      id: 'products',
      title: 'Materials',
      icon: <Box className="w-5 h-5" />,
      signal: 'positive' as SignalType,
      total: 11,
      highlight: 'This is your selected product. VCG supports the identification and assessment of its valorisation potential.',
      bgClass: 'bg-purple-50/50',
      borderClass: 'border-purple-500',
      textClass: 'text-purple-700',
      iconBgClass: 'bg-purple-100',
      signalText: 'Positive signals',
    },
    {
      id: 'market',
      title: 'Market',
      icon: <TrendingUp className="w-5 h-5" />,
      signal: 'positive' as SignalType,
      total: 12,
      highlight: 'Polyphenols have a strong market potential of 5 billion EUR, with 25 identified markets. With 4 high-growth segments, widespread adoption is expected across these market',
      bgClass: 'bg-orange-50/50',
      borderClass: 'border-orange-500',
      textClass: 'text-orange-700',
      iconBgClass: 'bg-orange-100',
      signalText: 'Positive signals',
    },
  ];

  const handleNext = () => {
    if (currentStep < summaryData.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const getSignalIcon = (signal: SignalType) => {
    switch (signal) {
      case 'positive':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'neutral':
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      case 'negative':
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  return (
    <div className="space-y-6 mb-6">
      {/* Header Statement */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-foreground">
            VCG has identified the creation of <span className="font-bold text-primary">{productName}</span> from sustainable inputs is possible through:
          </p>
        </CardContent>
      </Card>

      {/* Progressive Card Display - Horizontal stacking within a container */}
      <Card className="bg-card">
        <CardContent className="p-6">
          <div className="flex gap-4">
            {summaryData.map((item, index) => {
              // Show cards that have been read (index <= currentStep)
              if (index > currentStep) return null;
              
              const isCurrentCard = index === currentStep;
              const isPreviousCard = index < currentStep;
              const isLastStep = currentStep === summaryData.length - 1;
              const allCardsVisible = isLastStep;
              
              return (
                <Card
                  key={item.id}
                  className={`${item.bgClass} border-3 ${item.borderClass} transition-all duration-500 ${
                    isLastStep ? 'flex-1' : (isCurrentCard ? 'flex-[2]' : 'flex-1')
                  } ${isCurrentCard && !isLastStep ? 'shadow-xl' : 'shadow-sm opacity-90'} animate-scale-in min-w-0 ${allCardsVisible ? 'cursor-pointer hover:shadow-lg' : ''}`}
                  onClick={() => {
                    if (allCardsVisible) {
                      onCardClick?.(item.id as 'feedstock' | 'technology' | 'products' | 'market');
                    }
                  }}
                >
                  <CardContent className={`${(isCurrentCard && !isLastStep) ? 'p-6' : 'p-4'} h-full flex flex-col`}>
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`${item.iconBgClass} ${(isCurrentCard && !isLastStep) ? 'p-3' : 'p-2'} rounded-lg flex-shrink-0`}>
                          <div className={item.textClass}>
                            {React.cloneElement(item.icon, { className: (isCurrentCard && !isLastStep) ? 'w-5 h-5' : 'w-4 h-4' })}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/50 flex-shrink-0">
                        {getSignalIcon(item.signal)}
                      </div>
                    </div>
                    
                    <h3 className={`${(isCurrentCard && !isLastStep) ? 'text-xl' : 'text-base'} font-bold ${item.textClass} mb-2`}>
                      {item.title} ({item.total})
                    </h3>
                    
                    <p className={`${(isCurrentCard && !isLastStep) ? 'text-sm' : 'text-xs'} text-foreground leading-relaxed flex-grow`}>
                      {item.highlight}
                    </p>

                    {/* Navigation Buttons - Only on current card */}
                    {isCurrentCard && (
                      <div className="flex items-center justify-end mt-6 pt-4 border-t gap-3">
                        <span className="text-sm font-medium text-muted-foreground">
                          {currentStep + 1}/{summaryData.length}
                        </span>

                        {currentStep < summaryData.length - 1 && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNext();
                            }}
                            className="gap-2"
                          >
                            Next
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ValueChainSummary;
