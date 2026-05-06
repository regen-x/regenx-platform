import { MongoAbility, MongoQuery } from '@casl/ability';
import { AppAction } from '../../../domain/app-action.enum';
import { AppSubjects } from './app-subjects.type';

type PossibleAbilities = [AppAction, AppSubjects];
type Conditions = MongoQuery;

export type AppAbility = MongoAbility<PossibleAbilities, Conditions>;
