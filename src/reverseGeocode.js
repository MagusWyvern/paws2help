const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse'
const REQUEST_INTERVAL_MS = 1000
const CACHE_TTL_MS = 10 * 60 * 1000
const CACHE_PRECISION = 5

let nextAllowedRequestAt = 0
let requestQueue = Promise.resolve()

const reverseGeocodeCache = new Map()
const inFlightRequests = new Map()

function sleep(milliseconds) {
    return new Promise((resolve) => {
        globalThis.setTimeout(resolve, milliseconds)
    })
}

function roundCoordinate(value) {
    return Number(value).toFixed(CACHE_PRECISION)
}

function buildCacheKey(latitude, longitude) {
    return `${roundCoordinate(latitude)},${roundCoordinate(longitude)}`
}

function getCachedAddress(cacheKey) {
    const cachedItem = reverseGeocodeCache.get(cacheKey)
    if (!cachedItem) {
        return null
    }

    if (Date.now() - cachedItem.cachedAt > CACHE_TTL_MS) {
        reverseGeocodeCache.delete(cacheKey)
        return null
    }

    return cachedItem.addressName
}

function setCachedAddress(cacheKey, addressName) {
    reverseGeocodeCache.set(cacheKey, {
        addressName,
        cachedAt: Date.now(),
    })
}

function enqueueRateLimitedRequest(task) {
    const run = async () => {
        const waitTime = Math.max(0, nextAllowedRequestAt - Date.now())
        if (waitTime > 0) {
            await sleep(waitTime)
        }

        try {
            return await task()
        } finally {
            nextAllowedRequestAt = Date.now() + REQUEST_INTERVAL_MS
        }
    }

    const queuedTask = requestQueue.then(run, run)
    requestQueue = queuedTask.then(
        () => undefined,
        () => undefined
    )
    return queuedTask
}

export async function reverseGeocode(latitude, longitude) {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return ''
    }

    const cacheKey = buildCacheKey(latitude, longitude)
    const cachedAddress = getCachedAddress(cacheKey)
    if (cachedAddress) {
        return cachedAddress
    }

    if (inFlightRequests.has(cacheKey)) {
        return inFlightRequests.get(cacheKey)
    }

    const requestPromise = enqueueRateLimitedRequest(async () => {
        try {
            const url = `${NOMINATIM_REVERSE_URL}?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            const response = await fetch(url)

            if (!response.ok) {
                throw new Error(`Reverse geocode failed with status ${response.status}`)
            }

            const data = await response.json()
            const addressName = typeof data?.display_name === 'string' ? data.display_name : ''
            if (addressName) {
                setCachedAddress(cacheKey, addressName)
            }

            return addressName
        } finally {
            inFlightRequests.delete(cacheKey)
        }
    })

    inFlightRequests.set(cacheKey, requestPromise)
    return requestPromise
}
