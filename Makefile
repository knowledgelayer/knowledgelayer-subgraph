regenerate: 
	npm run codegen
	graph build --network localhost
	npm run remove-local
	npm run create-local
	npm run deploy-local

sub:
	npm run remove-local
	npm run create-local
	npm run deploy-local

# To launch these commands, you need first to auth with the graph-cli and the subgraph
## Mumbai hosted subgraph: https://thegraph.com/hosted-service/subgraph/knowledgelayer/knowledgelayer-mumbai
deploy-mumbai: 
	graph codegen
	graph build --network mumbai
	graph deploy --product hosted-service knowledgelayer/knowledgelayer-mumbai

## Mumbai hosted subgraph: https://thegraph.com/hosted-service/subgraph/knowledgelayer/knowledgelayer-polygon
deploy-polygon: 
	graph codegen
	graph build --network polygon
	graph deploy --product hosted-service knowledgelayer/knowledgelayer-polygon