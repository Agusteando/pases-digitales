declare global {
  const H3Error: typeof import('../../node_modules/h3').H3Error
  const H3Event: typeof import('../../node_modules/h3').H3Event
  const PASS_TIME_ZONE: typeof import('../../server/utils/passDates').PASS_TIME_ZONE
  const __buildAssetsURL: typeof import('../../node_modules/@nuxt/nitro-server/dist/runtime/utils/paths').buildAssetsURL
  const __publicAssetsURL: typeof import('../../node_modules/@nuxt/nitro-server/dist/runtime/utils/paths').publicAssetsURL
  const appendCorsHeaders: typeof import('../../node_modules/h3').appendCorsHeaders
  const appendCorsPreflightHeaders: typeof import('../../node_modules/h3').appendCorsPreflightHeaders
  const appendHeader: typeof import('../../node_modules/h3').appendHeader
  const appendHeaders: typeof import('../../node_modules/h3').appendHeaders
  const appendResponseHeader: typeof import('../../node_modules/h3').appendResponseHeader
  const appendResponseHeaders: typeof import('../../node_modules/h3').appendResponseHeaders
  const assertMethod: typeof import('../../node_modules/h3').assertMethod
  const buildWhatsAppTemplate: typeof import('../../server/utils/whatsappModule').buildWhatsAppTemplate
  const cachedEventHandler: typeof import('../../node_modules/nitropack/dist/runtime/internal/cache').cachedEventHandler
  const cachedFunction: typeof import('../../node_modules/nitropack/dist/runtime/internal/cache').cachedFunction
  const callNodeListener: typeof import('../../node_modules/h3').callNodeListener
  const categoryUsesEndDate: typeof import('../../server/utils/passDates').categoryUsesEndDate
  const cleanPlantelName: typeof import('../../server/utils/employee-engine').cleanPlantelName
  const clearResponseHeaders: typeof import('../../node_modules/h3').clearResponseHeaders
  const clearSession: typeof import('../../node_modules/h3').clearSession
  const createApp: typeof import('../../node_modules/h3').createApp
  const createAppEventHandler: typeof import('../../node_modules/h3').createAppEventHandler
  const createError: typeof import('../../node_modules/h3').createError
  const createEvent: typeof import('../../node_modules/h3').createEvent
  const createEventStream: typeof import('../../node_modules/h3').createEventStream
  const createRouter: typeof import('../../node_modules/h3').createRouter
  const defaultContentType: typeof import('../../node_modules/h3').defaultContentType
  const defineAppConfig: typeof import('../../node_modules/@nuxt/nitro-server/dist/runtime/utils/config').defineAppConfig
  const defineCachedEventHandler: typeof import('../../node_modules/nitropack/dist/runtime/internal/cache').defineCachedEventHandler
  const defineCachedFunction: typeof import('../../node_modules/nitropack/dist/runtime/internal/cache').defineCachedFunction
  const defineEventHandler: typeof import('../../node_modules/h3').defineEventHandler
  const defineLazyEventHandler: typeof import('../../node_modules/h3').defineLazyEventHandler
  const defineNitroErrorHandler: typeof import('../../node_modules/nitropack/dist/runtime/internal/error/utils').defineNitroErrorHandler
  const defineNitroPlugin: typeof import('../../node_modules/nitropack/dist/runtime/internal/plugin').defineNitroPlugin
  const defineNodeListener: typeof import('../../node_modules/h3').defineNodeListener
  const defineNodeMiddleware: typeof import('../../node_modules/h3').defineNodeMiddleware
  const defineRenderHandler: typeof import('../../node_modules/nitropack/dist/runtime/internal/renderer').defineRenderHandler
  const defineRequestMiddleware: typeof import('../../node_modules/h3').defineRequestMiddleware
  const defineResponseMiddleware: typeof import('../../node_modules/h3').defineResponseMiddleware
  const defineRouteMeta: typeof import('../../node_modules/nitropack/dist/runtime/internal/meta').defineRouteMeta
  const defineTask: typeof import('../../node_modules/nitropack/dist/runtime/internal/task').defineTask
  const defineWebSocket: typeof import('../../node_modules/h3').defineWebSocket
  const defineWebSocketHandler: typeof import('../../node_modules/h3').defineWebSocketHandler
  const deleteCookie: typeof import('../../node_modules/h3').deleteCookie
  const dispatchDuePermanentPassNotifications: typeof import('../../server/utils/permanentPassNotifications').dispatchDuePermanentPassNotifications
  const dispatchNotificationsForPass: typeof import('../../server/utils/notifications').dispatchNotificationsForPass
  const dynamicEventHandler: typeof import('../../node_modules/h3').dynamicEventHandler
  const editWhatsAppMessage: typeof import('../../server/utils/whatsappModule').editWhatsAppMessage
  const enrichTargets: typeof import('../../server/utils/authorizationRules').enrichTargets
  const eventHandler: typeof import('../../node_modules/h3').eventHandler
  const fetchWithEvent: typeof import('../../node_modules/h3').fetchWithEvent
  const formatAuthorizationTargetList: typeof import('../../server/utils/authorizationRules').formatAuthorizationTargetList
  const fromNodeMiddleware: typeof import('../../node_modules/h3').fromNodeMiddleware
  const fromPlainHandler: typeof import('../../node_modules/h3').fromPlainHandler
  const fromWebHandler: typeof import('../../node_modules/h3').fromWebHandler
  const getCachedWorkspaceUser: typeof import('../../server/utils/googleWorkspace').getCachedWorkspaceUser
  const getCookie: typeof import('../../node_modules/h3').getCookie
  const getEmployeeGroupCounts: typeof import('../../server/utils/authorizationRules').getEmployeeGroupCounts
  const getFastSoapEmployees: typeof import('../../server/utils/employee-engine').getFastSoapEmployees
  const getGmailClient: typeof import('../../server/utils/googleWorkspace').getGmailClient
  const getHeader: typeof import('../../node_modules/h3').getHeader
  const getHeaders: typeof import('../../node_modules/h3').getHeaders
  const getLegacyNotificationRules: typeof import('../../server/utils/authorizationRules').getLegacyNotificationRules
  const getMethod: typeof import('../../node_modules/h3').getMethod
  const getNotificationRules: typeof import('../../server/utils/authorizationRules').getNotificationRules
  const getPlantelDirectoryTargets: typeof import('../../server/utils/authorizationRules').getPlantelDirectoryTargets
  const getProxyRequestHeaders: typeof import('../../node_modules/h3').getProxyRequestHeaders
  const getQuery: typeof import('../../node_modules/h3').getQuery
  const getRequestFingerprint: typeof import('../../node_modules/h3').getRequestFingerprint
  const getRequestHeader: typeof import('../../node_modules/h3').getRequestHeader
  const getRequestHeaders: typeof import('../../node_modules/h3').getRequestHeaders
  const getRequestHost: typeof import('../../node_modules/h3').getRequestHost
  const getRequestIP: typeof import('../../node_modules/h3').getRequestIP
  const getRequestPath: typeof import('../../node_modules/h3').getRequestPath
  const getRequestProtocol: typeof import('../../node_modules/h3').getRequestProtocol
  const getRequestURL: typeof import('../../node_modules/h3').getRequestURL
  const getRequestWebStream: typeof import('../../node_modules/h3').getRequestWebStream
  const getResponseHeader: typeof import('../../node_modules/h3').getResponseHeader
  const getResponseHeaders: typeof import('../../node_modules/h3').getResponseHeaders
  const getResponseStatus: typeof import('../../node_modules/h3').getResponseStatus
  const getResponseStatusText: typeof import('../../node_modules/h3').getResponseStatusText
  const getRouteRules: typeof import('../../node_modules/nitropack/dist/runtime/internal/route-rules').getRouteRules
  const getRouterParam: typeof import('../../node_modules/h3').getRouterParam
  const getRouterParams: typeof import('../../node_modules/h3').getRouterParams
  const getSession: typeof import('../../node_modules/h3').getSession
  const getSigniaData: typeof import('../../server/utils/employee-engine').getSigniaData
  const getSourceLabel: typeof import('../../server/utils/authorizationRules').getSourceLabel
  const getValidatedQuery: typeof import('../../node_modules/h3').getValidatedQuery
  const getValidatedRouterParams: typeof import('../../node_modules/h3').getValidatedRouterParams
  const getWorkspaceUser: typeof import('../../server/utils/googleWorkspace').getWorkspaceUser
  const getWorkspaceUserPhoto: typeof import('../../server/utils/googleWorkspace').getWorkspaceUserPhoto
  const handleCacheHeaders: typeof import('../../node_modules/h3').handleCacheHeaders
  const handleCors: typeof import('../../node_modules/h3').handleCors
  const isAllRuleValue: typeof import('../../server/utils/authorizationRules').isAllRuleValue
  const isAuthorizedEmail: typeof import('../../server/utils/authorizationRules').isAuthorizedEmail
  const isCorsOriginAllowed: typeof import('../../node_modules/h3').isCorsOriginAllowed
  const isError: typeof import('../../node_modules/h3').isError
  const isEvent: typeof import('../../node_modules/h3').isEvent
  const isEventHandler: typeof import('../../node_modules/h3').isEventHandler
  const isGenericIdentity: typeof import('../../server/utils/employee-engine').isGenericIdentity
  const isMethod: typeof import('../../node_modules/h3').isMethod
  const isPreflightRequest: typeof import('../../node_modules/h3').isPreflightRequest
  const isStream: typeof import('../../node_modules/h3').isStream
  const isWebResponse: typeof import('../../node_modules/h3').isWebResponse
  const lazyEventHandler: typeof import('../../node_modules/h3').lazyEventHandler
  const logAuthorizationDebug: typeof import('../../server/utils/authorizationRules').logAuthorizationDebug
  const nitroPlugin: typeof import('../../node_modules/nitropack/dist/runtime/internal/plugin').nitroPlugin
  const normalizeComparable: typeof import('../../server/utils/authorizationRules').normalizeComparable
  const normalizeName: typeof import('../../server/utils/employee-engine').normalizeName
  const normalizePhoneDigits: typeof import('../../server/utils/authorizationRules').normalizePhoneDigits
  const normalizeRuleValue: typeof import('../../server/utils/authorizationRules').normalizeRuleValue
  const parseCookies: typeof import('../../node_modules/h3').parseCookies
  const parseMexicoCityDateOnly: typeof import('../../server/utils/passDates').parseMexicoCityDateOnly
  const promisifyNodeListener: typeof import('../../node_modules/h3').promisifyNodeListener
  const proxyRequest: typeof import('../../node_modules/h3').proxyRequest
  const readBody: typeof import('../../node_modules/h3').readBody
  const readFormData: typeof import('../../node_modules/h3').readFormData
  const readMultipartFormData: typeof import('../../node_modules/h3').readMultipartFormData
  const readRawBody: typeof import('../../node_modules/h3').readRawBody
  const readValidatedBody: typeof import('../../node_modules/h3').readValidatedBody
  const removeResponseHeader: typeof import('../../node_modules/h3').removeResponseHeader
  const requireAdmin: typeof import('../../server/utils/access').requireAdmin
  const resolveAuthorizationForPass: typeof import('../../server/utils/authorizationRules').resolveAuthorizationForPass
  const resolveEmployeePuesto: typeof import('../../server/utils/authorizationRules').resolveEmployeePuesto
  const resolveExclusiveAuthorizationForPass: typeof import('../../server/utils/authorizationRules').resolveExclusiveAuthorizationForPass
  const runTask: typeof import('../../node_modules/nitropack/dist/runtime/internal/task').runTask
  const sanitizeStatusCode: typeof import('../../node_modules/h3').sanitizeStatusCode
  const sanitizeStatusMessage: typeof import('../../node_modules/h3').sanitizeStatusMessage
  const sealSession: typeof import('../../node_modules/h3').sealSession
  const searchWorkspaceUsers: typeof import('../../server/utils/googleWorkspace').searchWorkspaceUsers
  const selectEffectiveRules: typeof import('../../server/utils/authorizationRules').selectEffectiveRules
  const send: typeof import('../../node_modules/h3').send
  const sendError: typeof import('../../node_modules/h3').sendError
  const sendIterable: typeof import('../../node_modules/h3').sendIterable
  const sendNoContent: typeof import('../../node_modules/h3').sendNoContent
  const sendProxy: typeof import('../../node_modules/h3').sendProxy
  const sendRedirect: typeof import('../../node_modules/h3').sendRedirect
  const sendStream: typeof import('../../node_modules/h3').sendStream
  const sendWebResponse: typeof import('../../node_modules/h3').sendWebResponse
  const sendWhatsAppMessage: typeof import('../../server/utils/whatsappModule').sendWhatsAppMessage
  const sendWorkspaceEmail: typeof import('../../server/utils/googleWorkspace').sendWorkspaceEmail
  const serveStatic: typeof import('../../node_modules/h3').serveStatic
  const setCookie: typeof import('../../node_modules/h3').setCookie
  const setHeader: typeof import('../../node_modules/h3').setHeader
  const setHeaders: typeof import('../../node_modules/h3').setHeaders
  const setResponseHeader: typeof import('../../node_modules/h3').setResponseHeader
  const setResponseHeaders: typeof import('../../node_modules/h3').setResponseHeaders
  const setResponseStatus: typeof import('../../node_modules/h3').setResponseStatus
  const signRecipientToken: typeof import('../../server/utils/token').signRecipientToken
  const splitCookiesString: typeof import('../../node_modules/h3').splitCookiesString
  const toEventHandler: typeof import('../../node_modules/h3').toEventHandler
  const toNodeListener: typeof import('../../node_modules/h3').toNodeListener
  const toPlainHandler: typeof import('../../node_modules/h3').toPlainHandler
  const toWebHandler: typeof import('../../node_modules/h3').toWebHandler
  const toWebRequest: typeof import('../../node_modules/h3').toWebRequest
  const unsealSession: typeof import('../../node_modules/h3').unsealSession
  const updateSession: typeof import('../../node_modules/h3').updateSession
  const updateWorkspaceUserPhone: typeof import('../../server/utils/googleWorkspace').updateWorkspaceUserPhone
  const useAppConfig: typeof import('../../node_modules/nitropack/dist/runtime/internal/config').useAppConfig
  const useBase: typeof import('../../node_modules/h3').useBase
  const useDB: typeof import('../../server/utils/db').useDB
  const useEvent: typeof import('../../node_modules/nitropack/dist/runtime/internal/context').useEvent
  const useNitroApp: typeof import('../../node_modules/nitropack/dist/runtime/internal/app').useNitroApp
  const useRuntimeConfig: typeof import('../../node_modules/nitropack/dist/runtime/internal/config').useRuntimeConfig
  const useSession: typeof import('../../node_modules/h3').useSession
  const useStorage: typeof import('../../node_modules/nitropack/dist/runtime/internal/storage').useStorage
  const verifyRecipientToken: typeof import('../../server/utils/token').verifyRecipientToken
  const writeEarlyHints: typeof import('../../node_modules/h3').writeEarlyHints
}
// for type re-export
declare global {
  // @ts-ignore
  export type { EventHandler, EventHandlerRequest, EventHandlerResponse, EventHandlerObject, H3EventContext } from '../../node_modules/h3'
  import('../../node_modules/h3')
  // @ts-ignore
  export type { AuthorizationTarget, AuthorizationResolution } from '../../server/utils/authorizationRules'
  import('../../server/utils/authorizationRules')
}
export { H3Event, H3Error, appendCorsHeaders, appendCorsPreflightHeaders, appendHeader, appendHeaders, appendResponseHeader, appendResponseHeaders, assertMethod, callNodeListener, clearResponseHeaders, clearSession, createApp, createAppEventHandler, createError, createEvent, createEventStream, createRouter, defaultContentType, defineEventHandler, defineLazyEventHandler, defineNodeListener, defineNodeMiddleware, defineRequestMiddleware, defineResponseMiddleware, defineWebSocket, defineWebSocketHandler, deleteCookie, dynamicEventHandler, eventHandler, fetchWithEvent, fromNodeMiddleware, fromPlainHandler, fromWebHandler, getCookie, getHeader, getHeaders, getMethod, getProxyRequestHeaders, getQuery, getRequestFingerprint, getRequestHeader, getRequestHeaders, getRequestHost, getRequestIP, getRequestPath, getRequestProtocol, getRequestURL, getRequestWebStream, getResponseHeader, getResponseHeaders, getResponseStatus, getResponseStatusText, getRouterParam, getRouterParams, getSession, getValidatedQuery, getValidatedRouterParams, handleCacheHeaders, handleCors, isCorsOriginAllowed, isError, isEvent, isEventHandler, isMethod, isPreflightRequest, isStream, isWebResponse, lazyEventHandler, parseCookies, promisifyNodeListener, proxyRequest, readBody, readFormData, readMultipartFormData, readRawBody, readValidatedBody, removeResponseHeader, sanitizeStatusCode, sanitizeStatusMessage, sealSession, send, sendError, sendIterable, sendNoContent, sendProxy, sendRedirect, sendStream, sendWebResponse, serveStatic, setCookie, setHeader, setHeaders, setResponseHeader, setResponseHeaders, setResponseStatus, splitCookiesString, toEventHandler, toNodeListener, toPlainHandler, toWebHandler, toWebRequest, unsealSession, updateSession, useBase, useSession, writeEarlyHints } from 'h3';
export { useNitroApp } from 'nitropack/runtime/internal/app';
export { useRuntimeConfig, useAppConfig } from 'nitropack/runtime/internal/config';
export { defineNitroPlugin, nitroPlugin } from 'nitropack/runtime/internal/plugin';
export { defineCachedFunction, defineCachedEventHandler, cachedFunction, cachedEventHandler } from 'nitropack/runtime/internal/cache';
export { useStorage } from 'nitropack/runtime/internal/storage';
export { defineRenderHandler } from 'nitropack/runtime/internal/renderer';
export { defineRouteMeta } from 'nitropack/runtime/internal/meta';
export { getRouteRules } from 'nitropack/runtime/internal/route-rules';
export { useEvent } from 'nitropack/runtime/internal/context';
export { defineTask, runTask } from 'nitropack/runtime/internal/task';
export { defineNitroErrorHandler } from 'nitropack/runtime/internal/error/utils';
export { buildAssetsURL as __buildAssetsURL, publicAssetsURL as __publicAssetsURL } from 'C:/Users/hp/pases-digitales/node_modules/@nuxt/nitro-server/dist/runtime/utils/paths';
export { defineAppConfig } from 'C:/Users/hp/pases-digitales/node_modules/@nuxt/nitro-server/dist/runtime/utils/config';
export { requireAdmin } from 'C:/Users/hp/pases-digitales/server/utils/access';
export { normalizeRuleValue, normalizeComparable, isAllRuleValue, normalizePhoneDigits, logAuthorizationDebug, formatAuthorizationTargetList, resolveEmployeePuesto, getNotificationRules, getLegacyNotificationRules, enrichTargets, getPlantelDirectoryTargets, selectEffectiveRules, getSourceLabel, resolveExclusiveAuthorizationForPass, resolveAuthorizationForPass, isAuthorizedEmail, getEmployeeGroupCounts } from 'C:/Users/hp/pases-digitales/server/utils/authorizationRules';
export { useDB } from 'C:/Users/hp/pases-digitales/server/utils/db';
export { normalizeName, cleanPlantelName, isGenericIdentity, getSigniaData, getFastSoapEmployees } from 'C:/Users/hp/pases-digitales/server/utils/employee-engine';
export { getGmailClient, sendWorkspaceEmail, getWorkspaceUserPhoto, getWorkspaceUser, getCachedWorkspaceUser, updateWorkspaceUserPhone, searchWorkspaceUsers } from 'C:/Users/hp/pases-digitales/server/utils/googleWorkspace';
export { dispatchNotificationsForPass } from 'C:/Users/hp/pases-digitales/server/utils/notifications';
export { PASS_TIME_ZONE, categoryUsesEndDate, parseMexicoCityDateOnly } from 'C:/Users/hp/pases-digitales/server/utils/passDates';
export { dispatchDuePermanentPassNotifications } from 'C:/Users/hp/pases-digitales/server/utils/permanentPassNotifications';
export { signRecipientToken, verifyRecipientToken } from 'C:/Users/hp/pases-digitales/server/utils/token';
export { sendWhatsAppMessage, editWhatsAppMessage, buildWhatsAppTemplate } from 'C:/Users/hp/pases-digitales/server/utils/whatsappModule';