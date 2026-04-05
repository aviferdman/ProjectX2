import { describe, it, expect } from 'vitest';
import { buildTaskGraph, getReadyTasks, isGraphComplete, hasRunningTasks } from '../src/task-graph.js';
import type { TaskGraphNode, DeliberationState } from '../src/types.js';

describe('Task Graph', () => {
  describe('buildTaskGraph', () => {
    it('should create tasks for initialization phase', () => {
      const graph = buildTaskGraph('initialization', 0);
      expect(graph.length).toBe(1);
      expect(graph[0].task.agentId).toBe('gm');
      expect(graph[0].dependsOn).toEqual([]);
      expect(graph[0].status).toBe('pending');
    });

    it('should create tasks for research phase with 3 sequential tasks', () => {
      const graph = buildTaskGraph('research', 1);
      expect(graph.length).toBe(3);

      const agents = graph.map(n => n.task.agentId);
      expect(agents).toContain('researcher');
      expect(agents).toContain('pm');
      expect(agents).toContain('gm');

      // Researcher has no deps, PM depends on researcher, GM depends on PM
      const researcher = graph.find(n => n.task.id.includes('researcher'))!;
      const pm = graph.find(n => n.task.id.includes('pm'))!;
      const gm = graph.find(n => n.task.id.includes('gm'))!;

      expect(researcher.dependsOn).toEqual([]);
      expect(pm.dependsOn).toContain(researcher.task.id);
      expect(gm.dependsOn).toContain(pm.task.id);
    });

    it('should create 3 proposal tasks for ideation proposals stage', () => {
      const state: DeliberationState = { stage: 'proposals', round: 0 };
      const graph = buildTaskGraph('ideation', 0, state);
      expect(graph.length).toBe(3);

      const agents = graph.map(n => n.task.agentId);
      expect(agents).toEqual(['researcher', 'pm', 'gm']);

      // Sequential: researcher → pm → gm
      expect(graph[0].dependsOn).toEqual([]);
      expect(graph[1].dependsOn).toContain(graph[0].task.id);
      expect(graph[2].dependsOn).toContain(graph[1].task.id);
    });

    it('should create 3 challenge tasks for ideation challenges stage', () => {
      const state: DeliberationState = { stage: 'challenges', round: 1 };
      const graph = buildTaskGraph('ideation', 1, state);
      expect(graph.length).toBe(3);

      const agents = graph.map(n => n.task.agentId);
      expect(agents).toEqual(['researcher', 'pm', 'gm']);

      // All task IDs include round number
      expect(graph[0].task.id).toContain('challenge-r1');
      expect(graph[1].task.id).toContain('challenge-r1');
      expect(graph[2].task.id).toContain('challenge-r1');
    });

    it('should create 3 verdict tasks for ideation convergence stage', () => {
      const state: DeliberationState = { stage: 'convergence', round: 1 };
      const graph = buildTaskGraph('ideation', 2, state);
      expect(graph.length).toBe(3);

      const agents = graph.map(n => n.task.agentId);
      expect(agents).toEqual(['researcher', 'pm', 'gm']);

      // All task IDs include round number and verdict
      expect(graph[0].task.id).toContain('verdict-r1');
    });

    it('should create 2 tasks for ideation final-decision stage', () => {
      const state: DeliberationState = { stage: 'final-decision', round: 2 };
      const graph = buildTaskGraph('ideation', 5, state);
      expect(graph.length).toBe(2);

      expect(graph[0].task.agentId).toBe('pm');
      expect(graph[1].task.agentId).toBe('gm');
      expect(graph[0].task.id).toContain('synthesize');
      expect(graph[1].task.id).toContain('decide');
      expect(graph[1].dependsOn).toContain(graph[0].task.id);
    });

    it('should use different round numbers in challenge task IDs', () => {
      const r1: DeliberationState = { stage: 'challenges', round: 1 };
      const r2: DeliberationState = { stage: 'challenges', round: 2 };
      const graph1 = buildTaskGraph('ideation', 3, r1);
      const graph2 = buildTaskGraph('ideation', 5, r2);

      expect(graph1[0].task.id).toContain('challenge-r1');
      expect(graph2[0].task.id).toContain('challenge-r2');
    });

    it('should default to proposals stage when no deliberation state given', () => {
      const graph = buildTaskGraph('ideation', 0);
      expect(graph.length).toBe(3);
      expect(graph[0].task.id).toContain('propose');
    });

    it('should create tasks for development phase', () => {
      const graph = buildTaskGraph('development', 2);
      expect(graph.length).toBe(4);

      const dev = graph.find(n => n.task.agentId === 'developer');
      const qa = graph.find(n => n.task.agentId === 'qa');
      const projm = graph.find(n => n.task.agentId === 'projm');
      const pm = graph.find(n => n.task.agentId === 'pm');

      expect(dev).toBeDefined();
      expect(qa).toBeDefined();
      expect(projm).toBeDefined();
      expect(pm).toBeDefined();

      // QA depends on developer
      expect(qa!.dependsOn).toContain(dev!.task.id);
      // ProjM depends on QA
      expect(projm!.dependsOn).toContain(qa!.task.id);
      // PM depends on ProjM
      expect(pm!.dependsOn).toContain(projm!.task.id);
    });

    it('should create tasks for planning phase', () => {
      const graph = buildTaskGraph('planning', 3);
      expect(graph.length).toBe(4);

      const pm = graph.find(n => n.task.agentId === 'pm');
      const projm = graph.find(n => n.task.agentId === 'projm');
      const hr = graph.find(n => n.task.agentId === 'hr');
      const gm = graph.find(n => n.task.agentId === 'gm');

      // PM has no deps, ProjM depends on PM, HR depends on ProjM, GM depends on ProjM and HR
      expect(pm!.dependsOn).toEqual([]);
      expect(projm!.dependsOn).toContain(pm!.task.id);
      expect(hr!.dependsOn).toContain(projm!.task.id);
      expect(gm!.dependsOn).toContain(projm!.task.id);
      expect(gm!.dependsOn).toContain(hr!.task.id);
    });

    it('should create tasks for testing phase', () => {
      const graph = buildTaskGraph('testing', 4);
      expect(graph.length).toBe(3);
    });

    it('should create tasks for launch phase', () => {
      const graph = buildTaskGraph('launch', 5);
      expect(graph.length).toBe(3);
    });

    it('should create tasks for monitoring phase', () => {
      const graph = buildTaskGraph('monitoring', 6);
      expect(graph.length).toBe(2);
    });

    it('should create tasks for pivot phase', () => {
      const graph = buildTaskGraph('pivot', 7);
      expect(graph.length).toBe(3);
    });

    it('should generate unique branch names per cycle', () => {
      const graph1 = buildTaskGraph('research', 0);
      const graph2 = buildTaskGraph('research', 1);

      const branch1 = graph1[0].task.branchName;
      const branch2 = graph2[0].task.branchName;
      expect(branch1).not.toBe(branch2);
    });

    it('should use correct branch naming convention', () => {
      const graph = buildTaskGraph('initialization', 0);
      expect(graph[0].task.branchName).toMatch(/^agent\/gm\//);
    });
  });

  describe('getReadyTasks', () => {
    it('should return tasks with no dependencies', () => {
      const graph = buildTaskGraph('research', 0);
      const ready = getReadyTasks(graph);

      // Only researcher should be ready (pm depends on researcher, gm depends on pm)
      expect(ready.length).toBe(1);
      expect(ready[0].task.agentId).toBe('researcher');
    });

    it('should return tasks whose dependencies are completed', () => {
      const graph = buildTaskGraph('research', 0);

      // Mark researcher as completed — pm should become ready
      graph[0].status = 'completed';

      const ready = getReadyTasks(graph);
      expect(ready.length).toBe(1);
      expect(ready[0].task.agentId).toBe('pm');
    });

    it('should return all tasks when none have dependencies', () => {
      const graph: TaskGraphNode[] = [
        {
          task: { id: 'a', agentId: 'x', description: '', dependencies: [], branchName: '' },
          dependsOn: [],
          status: 'pending',
        },
        {
          task: { id: 'b', agentId: 'y', description: '', dependencies: [], branchName: '' },
          dependsOn: [],
          status: 'pending',
        },
      ];

      const ready = getReadyTasks(graph);
      expect(ready.length).toBe(2);
    });

    it('should not return running tasks', () => {
      const graph: TaskGraphNode[] = [
        {
          task: { id: 'a', agentId: 'x', description: '', dependencies: [], branchName: '' },
          dependsOn: [],
          status: 'running',
        },
      ];

      const ready = getReadyTasks(graph);
      expect(ready.length).toBe(0);
    });
  });

  describe('isGraphComplete', () => {
    it('should return true when all tasks are completed', () => {
      const graph: TaskGraphNode[] = [
        {
          task: { id: 'a', agentId: 'x', description: '', dependencies: [], branchName: '' },
          dependsOn: [],
          status: 'completed',
        },
        {
          task: { id: 'b', agentId: 'y', description: '', dependencies: [], branchName: '' },
          dependsOn: [],
          status: 'completed',
        },
      ];

      expect(isGraphComplete(graph)).toBe(true);
    });

    it('should return true when tasks are completed or failed', () => {
      const graph: TaskGraphNode[] = [
        {
          task: { id: 'a', agentId: 'x', description: '', dependencies: [], branchName: '' },
          dependsOn: [],
          status: 'completed',
        },
        {
          task: { id: 'b', agentId: 'y', description: '', dependencies: [], branchName: '' },
          dependsOn: [],
          status: 'failed',
        },
      ];

      expect(isGraphComplete(graph)).toBe(true);
    });

    it('should return false when tasks are pending', () => {
      const graph: TaskGraphNode[] = [
        {
          task: { id: 'a', agentId: 'x', description: '', dependencies: [], branchName: '' },
          dependsOn: [],
          status: 'completed',
        },
        {
          task: { id: 'b', agentId: 'y', description: '', dependencies: [], branchName: '' },
          dependsOn: [],
          status: 'pending',
        },
      ];

      expect(isGraphComplete(graph)).toBe(false);
    });
  });

  describe('hasRunningTasks', () => {
    it('should return true when a task is running', () => {
      const graph: TaskGraphNode[] = [
        {
          task: { id: 'a', agentId: 'x', description: '', dependencies: [], branchName: '' },
          dependsOn: [],
          status: 'running',
        },
      ];

      expect(hasRunningTasks(graph)).toBe(true);
    });

    it('should return false when no task is running', () => {
      const graph: TaskGraphNode[] = [
        {
          task: { id: 'a', agentId: 'x', description: '', dependencies: [], branchName: '' },
          dependsOn: [],
          status: 'completed',
        },
      ];

      expect(hasRunningTasks(graph)).toBe(false);
    });
  });
});
