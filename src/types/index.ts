// src/types/index.ts
export interface DriverUser {
    driver_id: number;
    driver_code: string;
    first_name: string;
    last_name: string;
    email: string;
    nic_number: string;
    assigned_route_id: number | null;
}


export interface HaltProgress {
    stopId: number;
    stopName: string;
    stopOrder: number;
    estimatedTime: number;
    distanceFromStart: number;
    arrivedAt: string | null;
}