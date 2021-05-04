package httpserver

import (
	"context"

	"github.com/satori/uuid"

	"logging"
)

type ctxKey string

func NewRequestIdContext(ctx context.Context) (context.Context, error) {
	reqId, err := uuid.NewV1()
	if err != nil {
		return ctx, err
	}
	return context.WithValue(ctx, ctxKey("requestId"), reqId.String())
}

func RequestIdFromContext(ctx context.Context) string {
	reqId, ok := context.Value(ctxKey("requestId")).(string)
	if ok {
		return reqId
	}
	return ""
}
