import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface IStellarStoreState {
	publicKey: string;
	selectedClientPublicKey: string;
}

interface IStellarStoreActions {
	setPublicKey: (publicKey: string) => void;
	clearStellarStore: () => void;
}

const initialState: IStellarStoreState = {
	publicKey: '',
	selectedClientPublicKey: '',
};

export const useStellarStore = create(
	persist<IStellarStoreState>(() => initialState, {
		name: 'stellar',
		partialize: (state) => ({
			publicKey: state.publicKey,
			selectedClientPublicKey: state.selectedClientPublicKey,
		}),
	}),
);

export const setPublicKey: IStellarStoreActions['setPublicKey'] = (
	publicKey: string,
) => {
	useStellarStore.setState(() => ({ publicKey }));
};

export const clearStellarStore: IStellarStoreActions['clearStellarStore'] =
	() => {
		useStellarStore.setState(() => ({
			publicKey: '',
			selectedClientPublicKey: '',
		}));
	};

export const setSelectedClientPublicKey: IStellarStoreActions['setPublicKey'] =
	(publicKey: string) => {
		useStellarStore.setState(() => ({ selectedClientPublicKey: publicKey }));
	};
