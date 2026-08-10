import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CompanyBrief from '@/components/CompanyBrief';

const Priorities: React.FC = () => {
  const { category, topic } = useParams<{ category: string; topic: string }>();
  const navigate = useNavigate();
  const decodedTopic = decodeURIComponent(topic || '');

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] w-full mx-auto px-6 pt-4 pb-3 flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-7 text-xs"
          onClick={() => navigate(`/landscape/${category}/${topic}/value-chain`)}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Value Chain
        </Button>
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          {decodedTopic} · Priorities
        </div>
      </div>
      <div className="max-w-[1400px] w-full mx-auto px-6 pb-10">
        <CompanyBrief topic={decodedTopic} category={category} prioritiesOnly />
      </div>
    </div>
  );
};

export default Priorities;
