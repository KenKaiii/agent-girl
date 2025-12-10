/**
 * Agent Girl - Validation utilities barrel export
 * Error handling, result types, and data validation
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export { ApiError, BadRequestError, NotFoundError, UnauthorizedError } from './apiErrors';
export { Result, success, failure, isSuccess, isFailure } from './Result';
export { validateInput, validateSchema } from './validation';
