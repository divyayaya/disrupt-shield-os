import { supabase } from '../integrations/supabase/client.ts';

export class SupabaseService {
  static supabase = supabase;

  static async getOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select(`*, customers(name, tier, preferred_channel), suppliers(name, reliability, location)`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
    return data;
  }

  static async getSuppliers() {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('reliability', { ascending: false });

    if (error) {
      console.error('Error fetching suppliers:', error);
      return [];
    }
    return data;
  }

  static async createDisruption(disruption) {
    const { data, error } = await supabase
      .from('disruptions')
      .insert([disruption])
      .select();

    if (error) {
      console.error('Error creating disruption:', error);
      return null;
    }
    return data[0];
  }

  static async updateAgentState(agentName, state) {
    const { data, error } = await supabase
      .from('agent_states')
      .upsert({
        agent_name: agentName,
        state: state,
        last_execution: new Date().toISOString(),
        is_active: true
      }, { onConflict: 'agent_name' })
      .select();

    if (error) {
      console.error('Error updating agent state:', error);
      return null;
    }
    return data[0];
  }
}