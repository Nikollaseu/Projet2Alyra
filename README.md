# Projet2Alyra

On va venir tester Ownable 

await expectRevert(votingContractInstance.addVoter(voter1, { from: voter1 }), "caller is not the owner");
await expectRevert(votingContractInstance.endProposalsRegistering({ from: voter1 }), "caller is not the owner");
await expectRevert(votingContractInstance.startVotingSession({ from: voter1 }), "caller is not the owner");
await expectRevert(votingContractInstance.endVotingSession({ from: voter1 }), "caller is not the owner");
await expectRevert(votingContractInstance.tallyVotes({ from: voter1 }), "caller is not the owner");

On va venir tester le modifier 

await expectRevert(votingContractInstance.addProposal("", { from: owner }), "You're not a voter");
await votingContractInstance.startProposalsRegistering({from: owner}), "You're not a voter");
await expectRevert(votingContractInstance.getOneProposal(0, { from: owner }), "You're not a voter");
await expectRevert(votingContractInstance.setVote(0, { from: owner }), "You're not a voter");

L'admin ajoute des élécteurs sur la whitelist

await votingContractInstance.addVoter(voter1, { from: owner });
await votingContractInstance.addVoter(voter2, { from: owner });
await votingContractInstance.addVoter(voter3, { from: owner });

L'ajout de 3 voters

expectEvent(await votingContractInstance.addVoter(voter1, { from: owner }), "VoterRegistered", { voterAddress: voter1 });
expectEvent(await votingContractInstance.addVoter(voter2, { from: owner }), "VoterRegistered", { voterAddress: voter2 });
expectEvent(await votingContractInstance.addVoter(voter3, { from: owner }), "VoterRegistered", { voterAddress: voter3 });

Vérification du storage

const voter = await votingContractInstance.getVoter(voter1, { from: voter1 });
expect(voter.isRegistered).to.be.true;
expect(voter.hasVoted).to.be.false;
expect(new BN(voter.votedProposalId)).to.be.bignumber.equal(new BN(0));
    
const voter2 = await votingContractInstance.getVoter(voter2, { from: voter2 });
expect(voter2.isRegistered).to.be.true;
expect(voter2.hasVoted).to.be.false;
expect(new BN(voter2.votedProposalId)).to.be.bignumber.equal(new BN(0));

const voter3 = await votingContractInstance.getVoter(voter3, { from: voter3 });
expect(voter3.isRegistered).to.be.true;
expect(voter3.hasVoted).to.be.false;
expect(new BN(voter3.votedProposalId)).to.be.bignumber.equal(new BN(0));

Vérifie si un élécteur n'est pas ajouté deux fois dans la Whitelist

it("Un électeur ne peut pas être ajouté 2 fois sur la whitelist", async () => {
await votingContractInstance.addVoter(voter1, { from: owner });
await expectRevert(votingContractInstance.addVoter(voter1, { from: owner }), "Already registered");
});

Ajout des propositions 

// Ajout d'une proposition par le Voter 1
expectEvent(await votingContractInstance.addProposal("Rester chill avec ses amis", { from: voter1 }), "ProposalRegistered", { proposalId: new BN(1) });
const proposal1 = await votingContractInstance.getOneProposal(1, { from: voter1 });
expect("Rester chill avec ses amis").to.equal(proposal1.description);
    
// Ajout d'une proposition par le Voter 2
expectEvent(await votingContractInstance.addProposal("Faire de l'acrobranche !", { from: voter2 }), "ProposalRegistered", { proposalId: new BN(3) });
const proposal2 = await votingContractInstance.getOneProposal(2, { from: voter2 });
expect("Faire de l'acrobranche !").to.equal(proposal3.description);

// Ajout d'une proposition par le Voter 3
expectEvent(await votingContractInstance.addProposal("Laser Game !", { from: voter3 }), "ProposalRegistered", { proposalId: new BN(3) });
const proposal3 = await votingContractInstance.getOneProposal(3, { from: voter3 });
expect("Laser Game !").to.equal(proposal3.description);

On va venir ajouter 

expectEvent(await votingContractInstance.addVoter(voter1, { from: owner }), "VoterRegistered", { voterAddress: voter1 });
expectEvent(await votingContractInstance.addVoter(voter2, { from: owner }), "VoterRegistered", { voterAddress: voter2 });
expectEvent(await votingContractInstance.addVoter(voter3, { from: owner }), "VoterRegistered", { voterAddress: voter3 });



