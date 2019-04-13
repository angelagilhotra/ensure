# ensure

Health insurance network on the blockchain (prototype)

## Usage

### Start Fabric

1. Start Fabric Dev server
`cd fabric-dev-servers && ./startFabric.sh`
2. Create a Peer Admin Card
`./createPeerAdminCard.sh`
3. Increment the version number in `package.json`
4. create a `cd .. && composer archive` 
`composer archive create -t dir -n .`
5. Install network
`composer network install --card PeerAdmin@hlfv1 --archiveFile ensure@0.0.1.bna` (change version number)
6. Start the network
`composer network start --networkName ensure --networkVersion 0.0.1 --networkAdmin admin --networkAdminEnrollSecret adminpw --card PeerAdmin@hlfv1 --file networkadmin.card` (change version number)
7. Import card file
`composer card import --file networkadmin.card`
8. Ping the network
`composer network ping --card admin@ensure`

### Stop Fabric

1. Kill 8080/tcp process
`sudo fuser -k 8080/tcp`
2. Run stop fabric script
`cd fabric-dev-servers && ./stopFabric.sh`
3. Teardown data structures
`./teardownFabric.sh`
4. Kill docker containers
`docker kill $(docker ps -q)`
`docker rm $(docker ps -aq)`
`docker rmi $(docker images dev-* -q)`
5. Delete cards from composer cards
`composer card delete -c admin@ensure`
1. Delete `.bna` file and `.card` file from the folder