import { ICanvasNode, IConnection } from "@/src/lib/db/models/Design";

export type TemplateDifficulty = "easy" | "medium" | "hard";
export type TemplateCategory = "Bottleneck Resolution" | "Scaling Systems" | "Caching Optimization" | "Load Balancing" | "Fault Tolerance";

export interface ITemplate {
    id: string; // Unique identifier (e.g., 'curated-bottleneck-001' or 'ai-gen-123')
    title: string;
    description: string;
    category: TemplateCategory;
    difficulty: TemplateDifficulty;
    targetRps: number; // For the simulation engine
    
    // Starting state
    initialNodes: ICanvasNode[];
    initialConnections: IConnection[];
    
    // For validation
    bottleneckNodeId: string; // The specific node ID that is overloaded and needs fixing
    
    // Model Solution
    expectedSolution: string[]; // Descriptive tags or rules (e.g. ['add_cache'])
    modelSolution: {
        nodes: ICanvasNode[];
        connections: IConnection[];
    };
    solutionExplanation: string;
}
