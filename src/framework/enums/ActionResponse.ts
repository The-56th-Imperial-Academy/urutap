enum ActionResponse {
    ACCEPT,
    DENY,
}

namespace ActionResponse {
    export function isAccepted(value?: ActionResponse): boolean {
        return value == null || value === ActionResponse.ACCEPT;
    }
}

export {ActionResponse}