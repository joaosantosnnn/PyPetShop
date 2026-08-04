import { supabase } from '../lib/supabase';
import type { Appointment, Company, Customer, Pet, Service, UserProfile } from '../types';

export interface OperationalData {
  customers: Customer[];
  pets: Pet[];
  services: Service[];
  appointments: Appointment[];
  profiles: UserProfile[];
  company: Company;
}

const fail = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

export async function loadOperationalData(companyId: string): Promise<OperationalData> {
  const [customersResult, petsResult, servicesResult, appointmentsResult, profilesResult, companyResult] = await Promise.all([
    supabase.from('customers').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
    supabase.from('pets').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
    supabase.from('services').select('*').eq('company_id', companyId).order('name'),
    supabase.from('appointments').select('*').eq('company_id', companyId).order('scheduled_at'),
    supabase.from('profiles').select('*').eq('company_id', companyId).eq('is_active', true).order('full_name'),
    supabase.from('companies').select('*').eq('id', companyId).single(),
  ]);

  [customersResult, petsResult, servicesResult, appointmentsResult, profilesResult, companyResult].forEach(result => fail(result.error));

  const customers = (customersResult.data ?? []) as Customer[];
  const pets = (petsResult.data ?? []) as Pet[];
  const services = (servicesResult.data ?? []) as Service[];
  const profiles = (profilesResult.data ?? []) as UserProfile[];
  const customerById = new Map(customers.map(item => [item.id, item]));
  const petById = new Map(pets.map(item => [item.id, item]));
  const serviceById = new Map(services.map(item => [item.id, item]));
  const profileById = new Map(profiles.map(item => [item.id, item]));

  return {
    company: companyResult.data as Company,
    customers,
    pets: pets.map(item => ({ ...item, customer_name: customerById.get(item.customer_id)?.name })),
    services,
    profiles,
    appointments: ((appointmentsResult.data ?? []) as Appointment[]).map(item => {
      const customer = customerById.get(item.customer_id);
      const pet = petById.get(item.pet_id);
      const service = serviceById.get(item.service_id);
      const employee = item.employee_id ? profileById.get(item.employee_id) : undefined;
      return {
        ...item,
        customer_name: customer?.name,
        customer_phone: customer?.whatsapp || customer?.phone,
        pet_name: pet?.name,
        pet_photo: pet?.photo_url,
        pet_species: pet?.species,
        pet_allergies: pet?.allergies,
        pet_aggression: pet?.aggression_level,
        service_name: service?.name,
        employee_name: employee?.full_name,
      };
    }),
  };
}

export async function saveCompany(company: Company) {
  const { id, created_at: _createdAt, ...changes } = company;
  const { data, error } = await supabase.from('companies').update(changes).eq('id', id).select().single();
  fail(error);
  return data as Company;
}

export async function insertCustomer(customer: Customer) {
  const { data, error } = await supabase.from('customers').insert(customer).select().single();
  fail(error);
  return data as Customer;
}

export async function saveCustomer(customer: Customer) {
  const { id, company_id, ...changes } = customer;
  const { data, error } = await supabase.from('customers').update(changes).eq('id', id).eq('company_id', company_id).select().single();
  fail(error);
  return data as Customer;
}

export async function insertPet(pet: Pet) {
  const { customer_name: _customerName, ...row } = pet;
  const { data, error } = await supabase.from('pets').insert(row).select().single();
  fail(error);
  return { ...(data as Pet), customer_name: pet.customer_name };
}

export async function savePet(pet: Pet) {
  const { id, company_id, customer_name: _customerName, ...changes } = pet;
  const { data, error } = await supabase.from('pets').update(changes).eq('id', id).eq('company_id', company_id).select().single();
  fail(error);
  return { ...(data as Pet), customer_name: pet.customer_name };
}

export async function insertService(service: Service) {
  const { data, error } = await supabase.from('services').insert(service).select().single();
  fail(error);
  return data as Service;
}

export async function saveService(service: Service) {
  const { id, company_id, ...changes } = service;
  const { data, error } = await supabase.from('services').update(changes).eq('id', id).eq('company_id', company_id).select().single();
  fail(error);
  return data as Service;
}

const appointmentRow = (appointment: Appointment) => {
  const {
    customer_name: _customerName, customer_phone: _customerPhone, pet_name: _petName,
    pet_photo: _petPhoto, pet_species: _petSpecies, pet_allergies: _petAllergies,
    pet_aggression: _petAggression, service_name: _serviceName, employee_name: _employeeName,
    ...row
  } = appointment;
  return row;
};

export async function insertAppointment(appointment: Appointment) {
  const { data, error } = await supabase.from('appointments').insert(appointmentRow(appointment)).select().single();
  fail(error);
  return { ...appointment, ...(data as Appointment) };
}

export async function saveAppointment(appointment: Appointment) {
  const { id, company_id, ...changes } = appointmentRow(appointment);
  const { data, error } = await supabase.from('appointments').update(changes).eq('id', id).eq('company_id', company_id).select().single();
  fail(error);
  return { ...appointment, ...(data as Appointment) };
}
