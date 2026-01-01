import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pet, CareTask } from '@/types';
import { scheduleTaskNotifications } from '@/utils/notifications';
import { useEffect } from 'react';

const PETS_KEY = 'care_daily_pets';
const TASKS_KEY = 'care_daily_tasks';

export const [CareDailyProvider, useCareDaily] = createContextHook(() => {
  const queryClient = useQueryClient();

  const pets = useQuery({
    queryKey: ['pets'],
    queryFn: async (): Promise<Pet[]> => {
      const stored = await AsyncStorage.getItem(PETS_KEY);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const tasks = useQuery({
    queryKey: ['tasks'],
    queryFn: async (): Promise<CareTask[]> => {
      const stored = await AsyncStorage.getItem(TASKS_KEY);
      return stored ? JSON.parse(stored) : [];
    },
  });

  useEffect(() => {
    if (tasks.data && pets.data) {
      scheduleTaskNotifications(tasks.data, pets.data);
    }
  }, [tasks.data, pets.data]);

  const petsQuery = pets;
  const tasksQuery = tasks;

  const addPetMutation = useMutation({
    mutationFn: async (pet: Pet) => {
      const petsData = petsQuery.data || [];
      const updated = [...petsData, pet];
      await AsyncStorage.setItem(PETS_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
    },
  });

  const updatePetMutation = useMutation({
    mutationFn: async (pet: Pet) => {
      const petsData = petsQuery.data || [];
      const updated = petsData.map(p => p.id === pet.id ? pet : p);
      await AsyncStorage.setItem(PETS_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
    },
  });

  const deletePetMutation = useMutation({
    mutationFn: async (petId: string) => {
      const petsData = petsQuery.data || [];
      const tasksData = tasksQuery.data || [];
      const updatedPets = petsData.filter(p => p.id !== petId);
      const updatedTasks = tasksData.filter(t => t.petId !== petId);
      await AsyncStorage.setItem(PETS_KEY, JSON.stringify(updatedPets));
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updatedTasks));
      return { pets: updatedPets, tasks: updatedTasks };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: async (task: CareTask) => {
      const tasksData = tasksQuery.data || [];
      const updated = [...tasksData, task];
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (task: CareTask) => {
      const tasksData = tasksQuery.data || [];
      const updated = tasksData.map(t => t.id === task.id ? task : t);
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const tasksData = tasksQuery.data || [];
      const updated = tasksData.filter(t => t.id !== taskId);
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const markTaskCompleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const tasksData = tasksQuery.data || [];
      const task = tasksData.find(t => t.id === taskId);
      
      if (!task) throw new Error('Task not found');
      
      const now = new Date().toISOString();
      
      const updatedTask: CareTask = {
        ...task,
        isCompleted: true,
        completedAt: now,
      };
      
      const updatedTasks = tasksData.map(t => 
        t.id === taskId ? updatedTask : t
      );
      
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updatedTasks));
      
      return { tasks: updatedTasks };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const resetTodayTasksMutation = useMutation({
    mutationFn: async () => {
      const tasksData = tasksQuery.data || [];
      const today = new Date().toISOString().split('T')[0];
      
      const updatedTasks = tasksData.map(task => {
        if (task.completedAt && task.completedAt.startsWith(today)) {
          return { ...task, isCompleted: false, completedAt: undefined };
        }
        return task;
      });
      
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updatedTasks));
      return updatedTasks;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return {
    pets: petsQuery.data || [],
    tasks: tasksQuery.data || [],
    isLoading: petsQuery.isLoading || tasksQuery.isLoading,
    addPet: addPetMutation.mutateAsync,
    updatePet: updatePetMutation.mutateAsync,
    deletePet: deletePetMutation.mutateAsync,
    addTask: addTaskMutation.mutateAsync,
    updateTask: updateTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync,
    markTaskComplete: markTaskCompleteMutation.mutateAsync,
    resetTodayTasks: resetTodayTasksMutation.mutateAsync,
    isAddingPet: addPetMutation.isPending,
    isMarkingComplete: markTaskCompleteMutation.isPending,
  };
});

export function useTodayTasks() {
  const { tasks, pets } = useCareDaily();
  const today = new Date().toISOString().split('T')[0];
  
  return tasks
    .filter(task => task.createdDate === today || !task.completedAt || !task.completedAt.startsWith(today))
    .map(task => {
      const pet = pets.find(p => p.id === task.petId);
      return { ...task, petName: pet?.name || 'Unknown Pet', petPhoto: pet?.photoUri };
    })
    .sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      const timeSlotOrder = { Morning: 0, Noon: 1, Evening: 2, Bedtime: 3 };
      return timeSlotOrder[a.timeSlot] - timeSlotOrder[b.timeSlot];
    });
}

export function usePetTasks(petId: string) {
  const { tasks } = useCareDaily();
  return tasks.filter(task => task.petId === petId);
}
