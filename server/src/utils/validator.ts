import validator from 'validator';
import { Context } from 'koa';

import { ParameterError } from './error';

type RuleInstance = InstanceType<typeof Rule>

type ValidatorType = typeof validator;

type ValidatorKeys = keyof ValidatorType;

type ValidatorFunctionType<T> = T extends (...args: any) => boolean ? T : never;

type FunctionParameter<T> = T extends (arg1: any, ...args: infer P) => any ? P : never;

const getDataFromCtx = (ctx: Context) => {
  const { params } = ctx
  const { query, body } = ctx.request;
  return {
    ...query,
    ...body as Record<string, any>,
    ...params,
  };
}

export class Rule<T extends ValidatorFunctionType<ValidatorType[ValidatorKeys]>> {
  private v: T;
  private field: string;
  private args?: FunctionParameter<T>;
  private msg: string;
  private allow: boolean;
  private type?: string;

  constructor(v: T, field: string, ...args: FunctionParameter<T>) {
    this.v = v;
    this.field = field;
    this.args = args
    this.msg = `parameter "${this.field}" validation failed`
    this.allow = false
  }

  validate(form: Record<string, any>) {
    const value = form[this.field]
    if (value == null && this.allow) {
      return
    }

    if (this.type) {
      const is = Object.prototype.toString.call(value).slice(8, -1).toLowerCase() === this.type
      if (!is) {
        return this.msg
      }
    }

    // @ts-ignore
    const pass = this.v(String(value), ...this.args || []) as boolean
    if (pass) {
      return
    }

    return this.msg
  }

  wran(msg: string) {
    this.msg = msg
    return this
  }

  allowNull() {
    this.allow = true
    return this
  }

  stronglyTyped(type: string) {
    this.type = type
    return this
  }
}

export abstract class Validator<T extends Record<string, any> = Record<string, any>> {
  useValidate?(form:  T): any;
  useRules?(): void | undefined | RuleInstance[]
  
  async v(ctx: Context): Promise<T> {
    const form = getDataFromCtx(ctx)
    const rules = this.useRules?.() || []
    for (const rule of rules) {
      const errMsg = rule.validate(form)
      if (errMsg) {
        throw new ParameterError(errMsg);
      }
    }

    if (this.useValidate) {
      await Promise.resolve(this.useValidate(form as T));
    }

    return form as T;
  }

  async t(ctx: Context): Promise<{ error: string[], form: T }> {
    const form = getDataFromCtx(ctx)
    const rules = this.useRules?.() || []
    const error = []
    for (const rule of rules) {
      const errMsg = rule.validate(form)
      if (errMsg) {
        error.push(errMsg)
      }
    }

    if (this.useValidate) {
      try {
        await Promise.resolve(this.useValidate(form as T));
      } catch (err) {
        error.push(String(err))
      }
    }

    return {
      error,
      form: form as T
    }
  }
}

export function isIncludes(value: any, arr: any[]) {
  return arr.includes(value)
}
