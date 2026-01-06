.PHONY: stripe

stripe : 
	stripe listen --forward-to localhost:4321/api/stripe/webhook