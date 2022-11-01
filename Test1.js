const {BN, expectRevert, expectEvent} = require('@openzeppelin/test-helpers');
const{expect} = require('chai');
const Voting = artifacts.require("Voting");

contract('Voting', accounts => {
    const owner = accounts[0];
    const voter1 = accounts[1];
    const voter2 = accounts[2];
    const voter3 = accounts[3];

  

    
        let workflowStatus;
        let votingContractInstance;
    
    
            beforeEach(async function () {
                votingContractInstance = await Voting.new({ from: owner });
            });
    
            it("REVERT if the caller is not the owner", async () => {
                
                // Test Ownable
                
                await expectRevert(votingContractInstance.addVoter(voter1, { from: voter1 }), "caller is not the owner");
                await expectRevert(votingContractInstance.endProposalsRegistering({ from: voter1 }), "caller is not the owner");
                await expectRevert(votingContractInstance.startVotingSession({ from: voter1 }), "caller is not the owner");
                await expectRevert(votingContractInstance.endVotingSession({ from: voter1 }), "caller is not the owner");
                await expectRevert(votingContractInstance.tallyVotes({ from: voter1 }), "caller is not the owner");
            });
    
            it("REVERT if the caller is not a voter", async () => {
                
                // Test du modifier onlyVoters

                await expectRevert(votingContractInstance.addProposal("", { from: owner }), "You're not a voter");
                await votingContractInstance.startProposalsRegistering({from: owner}); 
                await expectRevert(votingContractInstance.getOneProposal(0, { from: owner }), "You're not a voter");
                await expectRevert(votingContractInstance.setVote(0, { from: owner }), "You're not a voter");
            });
    
            it("REVERT if the expected workflow is different", async () => {
                //console.log(await votingContractInstance.getVoter.call(voter1, {from: voter1}));
                // Initialialement le statut est RegisteringVoters

                expect(await votingContractInstance.workflowStatus.call()).to.be.bignumber.equal(new BN(0));
    
                // On déclare un voter pour le test
                
                await votingContractInstance.addVoter(voter1, { from: owner });
                await votingContractInstance.startProposalsRegistering({ from: owner });
    
                // REVERT car statut attendu différent (de RegisteringVoters) 
                await expectRevert(votingContractInstance.addProposal( { from: voter1 }), "Proposals are not allowed yet");
                await expectRevert(votingContractInstance.endProposalsRegistering({ from: owner }), "Registering proposals havent started yet");
                await expectRevert(votingContractInstance.startVotingSession({ from: owner }), "Registering proposals phase is not finished");
                await expectRevert(votingContractInstance.setVote(0, { from: voter1 }), "Voting session havent started yet");
                await expectRevert(votingContractInstance.endVotingSession({ from: owner }), "Voting session havent started yet");
                await expectRevert(votingContractInstance.tallyVotes({ from: owner }), "Current status is not voting session ended");
            });
        
    
            describe("Registration", function () {
    
            beforeEach(async function () {
                votingContractInstance = await Voting.new({ from: owner });
            });
    
            it("L'administrateur ajoute des electeurs sur la whitelist", async () => {
                await votingContractInstance.addVoter(voter1, { from: owner });
                await votingContractInstance.addVoter(voter2, { from: owner });
                await votingContractInstance.addVoter(voter3, { from: owner });
                // Test de l'ajout de 3 voters
                expectEvent(await votingContractInstance.addVoter(voter1, { from: owner }), "VoterRegistered", { voterAddress: voter1 });
                expectEvent(await votingContractInstance.addVoter(voter2, { from: owner }), "VoterRegistered", { voterAddress: voter2 });
                expectEvent(await votingContractInstance.addVoter(voter3, { from: owner }), "VoterRegistered", { voterAddress: voter3 });
    
                // Vérification du storage
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
            });
    
            it("Un électeur ne peut pas être ajouté 2 fois sur la whitelist", async () => {
                await votingContractInstance.addVoter(voter1, { from: owner });
                await expectRevert(votingContractInstance.addVoter(voter1, { from: owner }), "Already registered");
            });
        });
    
        describe("Proposal", function () {
    
            beforeEach(async function () {
                votingContractInstance = await Voting.new({ from: owner });
                await votingContractInstance.addVoter(voter1, { from: owner });
            });
    
            it("L'adminisrateur va ouvrir la session d'enregistrement des propositions", async () => {
                // Ouverture de la session
                expectEvent(await votingContractInstance.startProposalsRegistering({ from: owner }), "WorkflowStatusChange", { previousStatus: new BN(0), newStatus: new BN(1) });
                expect(await votingContractInstance.workflowStatus.call()).to.be.bignumber.equal(new BN(1));
    
                // Test de la proposition initialie GENESIS
                const proposal = await votingContractInstance.getOneProposal(0, { from: voter1 });
                expect("GENESIS").to.equal(proposal.description);
            });
    
            it("Un électeur ne peut pas ajouter un vote vide", async () => {
                await votingContractInstance.startProposalsRegistering({ from: owner });
                await expectRevert(votingContractInstance.addProposal("", { from: voter1 }), "C'est impossible de faire un vote vide");
            });
    
            it("On laisse aux élécteurs le choix d'ajouter des propositions", async () => {
    
                await votingContractInstance.addVoter(voter2, { from: owner });
                await votingContractInstance.startProposalsRegistering({ from: owner });
    
    
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


            });
    
            it("L'administrateur cloture la session d'enregistrement", async () => {
                // Ouverture de la session d'enregistrement
                await votingContractInstance.startProposalsRegistering({ from: owner });
                // Ajout d'une proposition
                expectEvent(await votingContractInstance.addProposal("Rester chill avec ses amis", { from: voter1 }), "ProposalRegistered", { proposalId: new BN(1) });

                expectEvent(await votingContractInstance.addProposal("Faire de l'acrobranche !", { from: voter2 }), "ProposalRegistered", { proposalId: new BN(2) });

                expectEvent(await votingContractInstance.addProposal("Laser Game", { from: voter3 }), "ProposalRegistered", { proposalId: new BN(3) });
    
                // Fermerture de la session d'enregistrement
                expectEvent(await votingContractInstance.endProposalsRegistering({ from: owner }), "WorkflowStatusChange", { previousStatus: new BN(1), newStatus: new BN(2) });
                const workflowStatus = await votingContractInstance.workflowStatus.call();
                // Check du nouveau statut
                expect(workflowStatus).to.be.bignumber.equal(new BN(2));
            });
    
        });
    
        describe("// ::::::::::::: VOTE ::::::::::::: //", function () {
    
            beforeEach(async function () {
                votingContractInstance = await Voting.new({ from: owner });
    
                expectEvent(await votingContractInstance.addVoter(voter1, { from: owner }), "VoterRegistered", { voterAddress: voter1 });
                expectEvent(await votingContractInstance.addVoter(voter2, { from: owner }), "VoterRegistered", { voterAddress: voter2 });
                expectEvent(await votingContractInstance.addVoter(voter3, { from: owner }), "VoterRegistered", { voterAddress: voter3 });
                expectEvent(await votingContractInstance.startProposalsRegistering({ from: owner }), "WorkflowStatusChange", { previousStatus: new BN(0), newStatus: new BN(1) });
                expectEvent(await votingContractInstance.addProposal("Rester chill entre amis", { from: voter1 }), "ProposalRegistered", { proposalId: new BN(1) });
            });
    
            it("L'administrateur ouvre la session de vote", async () => {
                expectEvent(await votingContractInstance.endProposalsRegistering({ from: owner }), "WorkflowStatusChange", { previousStatus: new BN(1), newStatus: new BN(2) });
                expectEvent(await votingContractInstance.startVotingSession({ from: owner }), "WorkflowStatusChange", { previousStatus: new BN(2), newStatus: new BN(3) });
                const workflowStatus = await votingContractInstance.workflowStatus.call();
                expect(workflowStatus).to.be.bignumber.equal(new BN(3));
            });
    
            it("L'électeur vote (une seule fois) pour sa proposition préférée", async () => {
                // Dans ce cas de test, les voters 1, 2 et 3 ajoutents d'autres propositions
                expectEvent(await votingContractInstance.addProposal("Rester chill entre amis", { from: voter1 }), "ProposalRegistered", { proposalId: new BN(2) });
                expectEvent(await votingContractInstance.addProposal("Rendre son projet de formation", { from: voter2 }), "ProposalRegistered", { proposalId: new BN(3) });
                expectEvent(await votingContractInstance.addProposal("Aller au Zoo", { from: voter3 }), "ProposalRegistered", { proposalId: new BN(4) });
                expectEvent(await votingContractInstance.addProposal("Aller à la salle", { from: voter3 }), "ProposalRegistered", { proposalId: new BN(5) });
    
                // Fin de la session d'nregistrement des propositions
                expectEvent(await votingContractInstance.endProposalsRegistering({ from: owner }), "WorkflowStatusChange", { previousStatus: new BN(1), newStatus: new BN(2) });
    
                // Début de la session des votes
                expectEvent(await votingContractInstance.startVotingSession({ from: owner }), "WorkflowStatusChange", { previousStatus: new BN(2), newStatus: new BN(3) });
    
                // Tester le vote pour une proposition inexistante
                await expectRevert(votingContractInstance.setVote(new BN(6), { from: voter1 }), "Proposal not found");
    
                // Vote d'un premier voter - On checke les donnnées du voter avant et apres le vote
                const voter1beforeVote = await votingContractInstance.getVoter(voter1, { from: voter1 });
                expect(voter1beforeVote.isRegistered).to.be.true;
                expect(voter1beforeVote.hasVoted).to.be.false;
                expect(new BN(voter1beforeVote.votedProposalId)).to.be.bignumber.equal(new BN(0));
    
                // Vote pour la proposition "Rendre son projet de formation"
                expectEvent(await votingContractInstance.setVote(new BN(3), { from: voter1 }), "Voted", { voter: voter1, proposalId: new BN(3) });
    
                const voter1AfterVote = await votingContractInstance.getVoter(voter1, { from: voter1 });
                expect(voter1AfterVote.isRegistered).to.be.true;
                expect(voter1AfterVote.hasVoted).to.be.true;
                expect(new BN(voter1AfterVote.votedProposalId)).to.be.bignumber.equal(new BN(3));
    
                // Vote d'un deuxième électeur 
                const voter2BeforeVote = await votingContractInstance.getVoter(voter2, { from: voter2 });
                expect(voter2BeforeVote.isRegistered).to.be.true;
                expect(voter2BeforeVote.hasVoted).to.be.false;
                expect(new BN(voter2BeforeVote.votedProposalId)).to.be.bignumber.equal(new BN(0));
    
                expectEvent(await votingContractInstance.setVote(new BN(5), { from: voter2 }), "Voted", { voter: voter2, proposalId: new BN(5) });
    
                const voter2AfterVote = await votingContractInstance.getVoter(voter2, { from: voter2 });
                expect(voter2AfterVote.isRegistered).to.be.true;
                expect(voter2AfterVote.hasVoted).to.be.true;
                expect(new BN(voter2AfterVote.votedProposalId)).to.be.bignumber.equal(new BN(5));

                // Vote d'un troisième élécteur 
                const voter3BeforeVote = await votingContractInstance.getVoter(voter2, { from: voter2 });
                expect(voter3BeforeVote.isRegistered).to.be.true;
                expect(voter3BeforeVote.hasVoted).to.be.true;
                expect(new BN(voter3BeforeVote.votedProposalId)).to.be.bignumber.equal(new BN(5));
    
                //Vote pour la proposition "Rendre son projet de formation"
                expectEvent(await votingContractInstance.setVote(new BN(3), { from: voter3 }), "Voted", { voter: voter3, proposalId: new BN(3) });
    
                const voter3AfterVote = await votingContractInstance.getVoter(voter3, { from: voter3 });
                expect(voter3AfterVote.isRegistered).to.be.true;
                expect(voter3AfterVote.hasVoted).to.be.true;
                expect(new BN(voter3AfterVote.votedProposalId)).to.be.bignumber.equal(new BN(3));

                
                // L'électeur ne peut pas voter 2 fois, on vérifie que son 2eme vote n'a pas écrasé le premier
                await expectRevert(votingContractInstance.setVote(new BN(4), { from: voter1 }), "You have already voted");
                const voter1AfterOtherVote = await votingContractInstance.getVoter(voter1, { from: voter1 });
                expect(voter1AfterOtherVote.isRegistered).to.be.true;
                expect(voter1AfterOtherVote.hasVoted).to.be.true;
                expect(new BN(voter1AfterOtherVote.votedProposalId)).to.be.bignumber.equal(new BN(3));
            });
    
            it("L'administrateur cloture la session des votes", async () => {
                expectEvent(await votingContractInstance.endProposalsRegistering({ from: owner }), "WorkflowStatusChange", { previousStatus: new BN(1), newStatus: new BN(2) });
                expectEvent(await votingContractInstance.startVotingSession({ from: owner }), "WorkflowStatusChange", { previousStatus: new BN(2), newStatus: new BN(3) });
                expectEvent(await votingContractInstance.setVote(new BN(1), { from: voter1 }), "Voted", { voter: voter1, proposalId: new BN(1) });
    
                expectEvent(await votingContractInstance.endVotingSession({ from: owner }), "WorkflowStatusChange", { previousStatus: new BN(3), newStatus: new BN(4) });
                const workflowStatus = await votingContractInstance.workflowStatus.call();
                expect(workflowStatus).to.be.bignumber.equal(new BN(4));
            });
        });
    
        describe("// ::::::::::::: RESULTS ::::::::::::: //", function () {
    
            beforeEach(async function () {
                votingContractInstance = await Voting.new({ from: owner });
            });
    
            it("L'administrateur désigne le vainqueur", async () => {
    
                // Checke du Statut initial
                expect(await votingContractInstance.workflowStatus.call()).to.be.bignumber.equal(new BN(0));
    
                // Déclaration de 5 voters
                expectEvent(await votingContractInstance.addVoter(voter1, { from: owner }), "VoterRegistered", { voterAddress: voter1 });
                expectEvent(await votingContractInstance.addVoter(voter2, { from: owner }), "VoterRegistered", { voterAddress: voter2 });
                expectEvent(await votingContractInstance.addVoter(voter3, { from: owner }), "VoterRegistered", { voterAddress: voter3 });
    
                // L'administrateur ouvre la session des propositions
                expectEvent(await votingContractInstance.startProposalsRegistering({ from: owner }), "WorkflowStatusChange", { previousStatus: new BN(0), newStatus: new BN(1) });
                expect(await votingContractInstance.workflowStatus.call()).to.be.bignumber.equal(new BN(1));
    
                // Ajout d'une propostion par voter
                expectEvent(await votingContractInstance.addProposal("Rester chill entre amis", { from: voter1 }), "ProposalRegistered", { proposalId: new BN(1) });
                expectEvent(await votingContractInstance.addProposal("Faire une randonnée", { from: voter2 }), "ProposalRegistered", { proposalId: new BN(2) });
                expectEvent(await votingContractInstance.addProposal("Rendre son projet de formation", { from: voter3 }), "ProposalRegistered", { proposalId: new BN(3) });
    
                // L'administrateur met fin à la session des propositions
                expectEvent(await votingContractInstance.endProposalsRegistering({ from: owner }), "WorkflowStatusChange", { previousStatus: new BN(1), newStatus: new BN(2) });
                expect(await votingContractInstance.workflowStatus.call()).to.be.bignumber.equal(new BN(2));
    
                // L'administrateur ouvre la session des votes
                expectEvent(await votingContractInstance.startVotingSession({ from: owner }), "WorkflowStatusChange", { previousStatus: new BN(2), newStatus: new BN(3) });
                expect(await votingContractInstance.workflowStatus.call()).to.be.bignumber.equal(new BN(3));
    
                // Votes enregistrés (2 votes pour "rendre son projet de formation", 1 vote pour "Rester chill entre amis")
                expectEvent(await votingContractInstance.setVote(new BN(3), { from: voter1 }), "Voted", { voter: voter1, proposalId: new BN(3) });
                expectEvent(await votingContractInstance.setVote(new BN(1), { from: voter2 }), "Voted", { voter: voter2, proposalId: new BN(1) });
                expectEvent(await votingContractInstance.setVote(new BN(3), { from: voter3 }), "Voted", { voter: voter3, proposalId: new BN(3) });

                // L'administrateur met fin à la session des votes 
                expectEvent(await votingContractInstance.endVotingSession({ from: owner }), "WorkflowStatusChange", { previousStatus: new BN(3), newStatus: new BN(4) });
                expect(await votingContractInstance.workflowStatus.call()).to.be.bignumber.equal(new BN(4));
    
                // L'administrateur comptabilise les votes
                expectEvent(await votingContractInstance.tallyVotes({ from: owner }), "WorkflowStatusChange", { previousStatus: new BN(4), newStatus: new BN(5) });
                expect(await votingContractInstance.workflowStatus.call()).to.be.bignumber.equal(new BN(5));
    
                // L'administrateur déclare la proposition gagnante  
                const winningProposalID = await votingContractInstance.winningProposalID.call();
                expect(winningProposalID).to.be.bignumber.equal(new BN(3));
    
                await expectRevert(votingContractInstance.addVoter(voter1, { from: owner }), "Voters registration is not open yet");
            });
        });
    });
