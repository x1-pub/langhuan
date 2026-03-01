import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { showSuccess } from '@/utils/global-notification';
import { trpc } from '@/utils/trpc';
import { DEFAULT_VALIDATION, TActiveTab, TMongoValidation } from '../../shared';
import { parseJSONObject } from '../utils';

interface UseMongoValidationModelParams {
  connectionId: number;
  dbName: string;
  tableName?: string;
  validTableName: boolean;
  activeTab: TActiveTab;
}

export interface ValidationPanelModelProps {
  validatorText: string;
  validationLevel: 'off' | 'strict' | 'moderate';
  validationAction: 'error' | 'warn';
  isLoading: boolean;
  isSaving: boolean;
  onChangeValidatorText: (value: string) => void;
  onChangeValidationLevel: (value: 'off' | 'strict' | 'moderate') => void;
  onChangeValidationAction: (value: 'error' | 'warn') => void;
  onRefresh: () => void;
  onReset: () => void;
  onSave: () => void;
}

interface UseMongoValidationModelResult {
  validationPanelProps: ValidationPanelModelProps;
}

const stringifyValidator = (validator: unknown) => {
  try {
    return JSON.stringify(validator || {}, null, 2);
  } catch {
    return DEFAULT_VALIDATION;
  }
};

const useMongoValidationModel = ({
  connectionId,
  dbName,
  tableName,
  validTableName,
  activeTab,
}: UseMongoValidationModelParams): UseMongoValidationModelResult => {
  const { t } = useTranslation();
  const [validatorText, setValidatorText] = useState(DEFAULT_VALIDATION);
  const [validationLevel, setValidationLevel] = useState<'off' | 'strict' | 'moderate'>('strict');
  const [validationAction, setValidationAction] = useState<'error' | 'warn'>('error');

  const getValidationQuery = useQuery(
    trpc.mongodb.getCollectionValidation.queryOptions(
      {
        connectionId,
        dbName,
        tableName: tableName || '',
      },
      {
        enabled: !!connectionId && !!dbName && validTableName && activeTab === 'validation',
      },
    ),
  );

  const updateValidationMutation = useMutation(
    trpc.mongodb.updateCollectionValidation.mutationOptions(),
  );

  const handleResetByData = (data?: TMongoValidation) => {
    setValidatorText(stringifyValidator(data?.validator));
    setValidationLevel(String(data?.validationLevel || 'strict') as 'off' | 'strict' | 'moderate');
    setValidationAction(String(data?.validationAction || 'error') as 'error' | 'warn');
  };

  const handleSaveValidation = async () => {
    if (!tableName) {
      return;
    }

    const parsedValidator = parseJSONObject(validatorText, t('mongodb.validator'), t);
    if (!parsedValidator) {
      return;
    }

    await updateValidationMutation.mutateAsync({
      connectionId,
      dbName,
      tableName,
      validator: JSON.stringify(parsedValidator),
      validationLevel,
      validationAction,
    });

    showSuccess(t('mongodb.validationSaved'));
    getValidationQuery.refetch();
  };

  useEffect(() => {
    if (!getValidationQuery.data) {
      return;
    }

    handleResetByData(getValidationQuery.data as TMongoValidation);
  }, [getValidationQuery.data]);

  useEffect(() => {
    setValidatorText(DEFAULT_VALIDATION);
    setValidationLevel('strict');
    setValidationAction('error');
  }, [dbName, tableName]);

  const validationPanelProps = useMemo(
    () => ({
      validatorText,
      validationLevel,
      validationAction,
      isLoading: getValidationQuery.isLoading,
      isSaving: updateValidationMutation.isPending,
      onChangeValidatorText: setValidatorText,
      onChangeValidationLevel: setValidationLevel,
      onChangeValidationAction: setValidationAction,
      onRefresh: () => getValidationQuery.refetch(),
      onReset: () => handleResetByData(getValidationQuery.data as TMongoValidation | undefined),
      onSave: handleSaveValidation,
    }),
    [
      validatorText,
      validationLevel,
      validationAction,
      getValidationQuery.isLoading,
      getValidationQuery.data,
      updateValidationMutation.isPending,
    ],
  );

  return {
    validationPanelProps,
  };
};

export default useMongoValidationModel;
