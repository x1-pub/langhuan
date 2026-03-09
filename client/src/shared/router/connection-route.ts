import { EConnectionType } from '@packages/types/connection';

export interface ParsedConnectionRouteParams {
  connectionType: EConnectionType;
  connectionId: number;
}

export const isConnectionType = (value?: string): value is EConnectionType => {
  return Object.values(EConnectionType).includes(value as EConnectionType);
};

export const parseConnectionRouteParams = (
  connectionType: string | undefined,
  connectionId: string | undefined,
): ParsedConnectionRouteParams | undefined => {
  const numericConnectionId = Number(connectionId);
  const isValidConnectionId = Number.isInteger(numericConnectionId) && numericConnectionId > 0;

  if (!isConnectionType(connectionType) || !isValidConnectionId) {
    return undefined;
  }

  return {
    connectionType,
    connectionId: numericConnectionId,
  };
};

export const buildConnectionRoutePath = (params: ParsedConnectionRouteParams) => {
  return `/${params.connectionType}/${params.connectionId}`;
};
