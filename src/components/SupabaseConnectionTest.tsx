import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ConnectionTestProps {
  onResult: (isConnected: boolean, error?: string) => void;
}

export const SupabaseConnectionTest: React.FC<ConnectionTestProps> = ({ onResult }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('Testing Supabase connection...');
        
        // Test basic connection
        const { data, error } = await supabase
          .from('orders')
          .select('id')
          .limit(1);

        if (error) {
          console.error('Supabase connection failed:', error);
          onResult(false, error.message);
        } else {
          console.log('Supabase connection successful!', data);
          onResult(true);
        }
      } catch (error) {
        console.error('Connection test failed:', error);
        onResult(false, error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    testConnection();
  }, [onResult]);

  if (isLoading) {
    return (
      <div className="p-4 bg-blue-100 border border-blue-300 rounded">
        <p className="text-blue-800">Testing Supabase connection...</p>
      </div>
    );
  }

  return null;
};