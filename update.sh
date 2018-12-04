#!/bin/sh

composer archive create -t dir -n .

composer network install -a ensure@0.0.$1.bna -c PeerAdmin@hlfv1

composer network upgrade -c PeerAdmin@hlfv1 -n ensure -V 0.0.$1