import { useCallback, useReducer } from 'react';

import { ILoadingState } from '../../interfaces/auth/ILoadingState';

type ActionType = 'SET_LOADING';
export const SET_LOADING = 'SET_LOADING';

interface Action {
	type: ActionType;
	payload: keyof ILoadingState;
	value: boolean;
}

const initialState: ILoadingState = {
	signIn: false,
	signUp: false,
	forgotPassword: false,
	resendConfirmationCode: false,
	confirmPassword: false,
	refreshSession: false,
};

const reducer = (state: ILoadingState, action: Action): ILoadingState => {
	switch (action.type) {
		case SET_LOADING:
			return { ...initialState, [action.payload]: action.value };
		default:
			return state;
	}
};

export const useLoadingState = () => {
	const [loadingState, dispatch] = useReducer(reducer, initialState);

	const setLoadingState = useCallback(
		(loadingType: keyof ILoadingState, value: boolean) => {
			dispatch({ type: SET_LOADING, payload: loadingType, value });
		},
		[],
	);

	return { loadingState, setLoadingState };
};
