import { create } from "zustand";

type Status = {
  loading: boolean;
  error: boolean;
  success: boolean;
};

export interface State extends Status {}

export type Set = (
  partial: State | Partial<State> | ((state: State) => State | Partial<State>),
  replace?: boolean | undefined
) => void;

const useStore = create<State>((set, get) => ({
  loading: false,
  error: false,
  success: false,
}));

export default useStore;
