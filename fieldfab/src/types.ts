export interface LooseMaterial {
    id: number;
    qty: number;
    part: string;
    size: string;
    description: string;
    type: string;
    options?: string[];
    sizes?: string[];
}

export interface Outlet {
    location: number; // inches?
    size: string;
    type: string;
    direction: string;
}

export type ThreadedFittingType =
    | "threadedelbow90"
    | "threadedtee"
    | "threadedreducingelbow90"
    | "threadedreducingtee"
    | "threadedcoupling"
    | "threadedreducingcoupling"
    | "threadedunion"
    | "threadedbushing"
    | "threadedcap"
    | "threadedplug";

export interface ThreadedFitting {
    type: ThreadedFittingType;
    location: number;
    direction?: "up" | "down";
    size?: string;
    runSize?: string;
    branchSize?: string;
    outletSize?: string;
}

export interface Piece {
    id?: number;
    qty: number;
    feet: string;
    inches: string;
    pipeType: string;
    pipeTag: string;
    diameter: string;
    fittingsEnd1: string;
    fittingsEnd2: string;
    outlets?: Outlet[];
    threadedFittings?: ThreadedFitting[];
}

export interface Project {
    id: number;
    name: string;
    companyName: string;
    streetNumber: string;
    streetName: string;
    city: string;
    zipcode: string;
    pieces: Piece[];
    looseMaterials?: LooseMaterial[];
    createdAt: string;
    updatedAt: string;
    schemaVersion: number;
}
