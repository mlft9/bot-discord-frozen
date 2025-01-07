const { 
    Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ButtonStyle, 
    StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, 
    PermissionsBitField, ActionRowBuilder 
} = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const discordTranscripts = require('discord-html-transcripts');
require("dotenv").config();



// --------------------------------------------------------------------------------------------------------------------------------
// Permissions
const permissions = {
    ban: PermissionsBitField.Flags.BanMembers,
    kick: PermissionsBitField.Flags.KickMembers,
    mute: PermissionsBitField.Flags.MuteMembers,
    warn: PermissionsBitField.Flags.ManageMessages,
};


// --------------------------------------------------------------------------------------------------------------------------------
// Configuration
// Format des dates en français
const formatDate = (date) => {return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short' }).format(date);};

const ticketowner = new Map();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ]
});

// Fonction pour envoyer l'embed avec le select menu
async function sendTicketPanel(channel) {
    const actionRow = new ActionRowBuilder().addComponents(selectMenu);
    await channel.send({ embeds: [panelticket], components: [actionRow] });
}

// Ajout role
client.on('guildMemberAdd', async (member) => {
    const specialRoleId = '1292067066534428704';

    try {
        await member.roles.add(specialRoleId);
        console.log(`Le rôle spécial a été attribué à ${member.user.tag}.`);
    } catch (error) {
        console.error(`Erreur lors de l'attribution du rôle à ${member.user.tag}:`, error);
    }   
});


// --------------------------------------------------------------------------------------------------------------------------------
// /infos
client.on('ready', async () => {
    const guild = client.guilds.cache.get(process.env.ID_SERVEUR);

    // Tableau des commandes
    const commands = [
        new SlashCommandBuilder()
            .setName('infos')
            .setDescription("Permet d'obtenir les informations d'un utilisateur")
            .addUserOption(option => option
                .setName('user')
                .setDescription('Choisir un utilisateur')
                .setRequired(true)),
        new SlashCommandBuilder()
            .setName('close')
            .setDescription("Permet de fermer un ticket")
    ];

    // Création des commandes dans la guilde
    for (const command of commands) {
        await guild.commands.create(command);
        console.log(`Commande créée : /${command.name}`);
    }

    console.log('Toutes les commandes ont été créées');

// Panel ticket - Envoi
    const channel = client.channels.cache.get(process.env.TICKET_CHANNEL_ID);

    if (channel) {
        const messages = await channel.messages.fetch({ limit: 10 });
        const embedExists = messages.some(msg => 
            msg.embeds.length > 0 && msg.embeds[0].title === "Tickets - Unixo Cloud"
        );
        if (!embedExists) {
            await sendTicketPanel(channel); 
            console.log('Embed du ticket envoyé dans le canal');
        } else {
            console.log('Panel ticket déjà existant');
        }
    } else {
        console.log('Canal introuvable');
    }
});

// --------------------------------------------------------------------------------------------------------------------------------
// Ticket
const panelticket = new EmbedBuilder()
    .setColor("Blue")
    .setTitle(`Tickets - Unixo Cloud`)
    .setDescription("Sélectionner votre raison de ticket afin que l'équipe d'Unixo Cloud le traite correctement.")
    .setThumbnail(process.env.LOGO)
    .addFields(
        { name: '🔧 | Problème Technique', value: "Si vous rencontrer un problème technique lié à nos services."},
        { name: '💰 | Problème Commercial', value: "Si vous souhaitez entrer en lien avec l'équipe commercial."},
        { name: '❓ | Question', value: "Si vous avez la moindre question non en lien avec les catégories ci-dessus."},
        { name: '💼 | Partenariat', value: "Si vous souhaitez devenir partenaires d'Unixo Cloud."},
    )
    .setFooter({ text: process.env.FOOTER, })
    .setTimestamp();

const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('ticket_reason')
    .setPlaceholder('Choisissez une raison pour ouvrir votre ticket')
    .addOptions([
        {
            label: '🔧 Problème Technique',
            value: 'technical_issue',
        },
        {
            label: '💰 Problème Commercial',
            value: 'commercial_issue',
        },
        {
            label: '❓ Question',
            value: 'question',
        },
        {
            label: '💼 Partenariat',
            value: 'partnership',
        },
    ]);

    const ticket = new EmbedBuilder()
    .setColor("Blue")
    .setTitle(`Tickets - Unixo Cloud`)
    .setDescription("Voici votre ticket. Un membre du staff va bientôt vous prendre en charge. \n Pour fermer le ticket, demander à un staff d'exécuter la commande. \n L'équipe Redstart Hosting")
    .setThumbnail(process.env.LOGO)
    .setFooter({ text: process.env.FOOTER, })
    .setTimestamp();

    const renameButton = new ButtonBuilder()
    .setCustomId('rename_ticket')
    .setLabel('Renommer le ticket')
    .setStyle(ButtonStyle.Primary);

    const actionRow = new ActionRowBuilder().addComponents(renameButton);


client.on("interactionCreate", async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    const categorie_ticket = "1297951505844011048";
    const rolesupport = "1292067017477586976";
    const guild = client.guilds.cache.get(process.env.ID_SERVEUR);

    if (!guild) {
        console.error("Guilde non trouvée.");
        return;
    }

    if ([...ticketowner.values()].includes(interaction.user.id)) {
        return interaction.reply({ content: "Vous avez déjà un ticket ouvert. Veuillez d'abord le fermer avant d'en ouvrir un autre.", ephemeral: true });
    }

    async function creerTicket(typeTicket, user) {
        const ticket_channel = await guild.channels.create({
            name: `${typeTicket}-${user.username}`,
            type: 0,
            parent: categorie_ticket, 
            permissionOverwrites: [
                {
                    id: user.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                },
                {
                    id: rolesupport,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                },
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
            ],
        });

        ticketowner.set(ticket_channel.id, user.id); 

        interaction.reply({ content: "Votre ticket a été créé avec succès : <#" + ticket_channel.id + ">", ephemeral: true });
        ticket_channel.send({ content: `<@${user.id}>, `, embeds: [ticket], components: [actionRow] }); // <@&1292067017477586976>

        return ticket_channel;
    }

    const ticketTypes = {
        'technical_issue': 'tech',
        'commercial_issue': 'commercial',
        'question': 'question',
        'partnership': 'partenaire'
    };

    const ticketType = ticketTypes[interaction.values[0]];

    if (ticketType) {
        const ticket_channel = await creerTicket(ticketType, interaction.user);
    }

});


// --------------------------------------------------------------------------------------------------------------------------------
// Commandes

// /close
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'close') {
        if (interaction.channel.parentId === "1297951505844011048") {
            const closeButton = new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Fermer le ticket')
                .setStyle(ButtonStyle.Danger);

            const actionRow = new ActionRowBuilder().addComponents(closeButton);

            await interaction.reply({ content: "Voulez-vous vraiment fermer ce ticket ?", components: [actionRow], ephemeral: true });
        } else {
            await interaction.reply({ content: "Merci d'utiliser cette commande dans un ticket.", ephemeral: true });
        }
    }
});
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'close_ticket') {
        if (interaction.channel.parentId === "1297951505844011048") {
            
            try {
                const channel = interaction.channel ; // or however you get your TextChannel
                const attachment = await discordTranscripts.createTranscript(channel);
                const transcriptChannel = client.channels.cache.get(process.env.TRANSCRIPT_CHANNEL_ID);

                if (transcriptChannel) {
                    await transcriptChannel.send({
                        content: `Le ticket ${interaction.channel.name} a été fermé. Voici le transcript:`,
                        files: [attachment]
                    });             
                }

                const ownerId = ticketowner.get(interaction.channel.id);
                const ticketOwner = await interaction.guild.members.fetch(ownerId);

                if (ticketOwner) {
                    await ticketOwner.send({
                        content: `Le ticket ${interaction.channel.name} a été fermé. Voici le transcript:`,
                        files: [attachment]
                    });  
                }
                ticketowner.delete(interaction.channel.id);
                await interaction.reply({ content: "Le transcript a été sauvegardé avec succès et envoyé au propriétaire du ticket. Le ticket va être supprimé.", ephemeral: true });
                await interaction.channel.delete();

            } catch (error) {
                console.error('Erreur lors de la création ou de l\'envoi du transcript:', error);
                await interaction.reply({ content: "Une erreur est survenue lors de la création du transcript. Veuillez réessayer.", ephemeral: true });
            }

        } else {
            await interaction.reply({ content: "Merci d'utiliser cette commande dans un ticket.", ephemeral: true });
        }
    }
});


// Bouton rename
client.on("interactionCreate", async (interaction) => {
    if (interaction.isButton() && interaction.customId === 'rename_ticket') {
        const modal = new ModalBuilder()
            .setCustomId('rename_ticket_modal')
            .setTitle('Renommer le ticket');

        const newNameInput = new TextInputBuilder()
            .setCustomId('new_ticket_name')
            .setLabel('Entrez le nouveau nom du ticket')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Nouveau nom du ticket')
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(newNameInput);
        modal.addComponents(firstActionRow);
        await interaction.showModal(modal);
    }
});
client.on('interactionCreate', async (interaction) => {
    if (interaction.isModalSubmit() && interaction.customId === 'rename_ticket_modal') {
        const newTicketName = interaction.fields.getTextInputValue('new_ticket_name');

        try {
            await interaction.channel.setName(newTicketName);
            await interaction.reply({ content: `Le ticket a été renommé en ${newTicketName}.`, ephemeral: true });
        } catch (error) {
            console.error('Erreur lors du renommage du ticket:', error);
            await interaction.reply({ content: "Une erreur est survenue lors du renommage du ticket.", ephemeral: true });
        }
    }
});

// /infos
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'infos') {
        const user = interaction.options.getUser('user');
        const member = interaction.guild.members.cache.get(user.id);

        const roles = member.roles.cache
            .map(role => `<@&${role.id}>`) 
            .join(', ') || "Aucun rôle";

        const embed = new EmbedBuilder()
            .setColor(member.roles.highest.color || '#000000') 
            .setTitle(`Informations de ${user.username}`)
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: 'Nom', value: user.username},
                { name: 'ID', value: user.id},
                { name: 'Création du compte', value: formatDate(user.createdAt)}, 
                { name: 'Rejoint le serveur', value: formatDate(member.joinedAt)}, 
                { name: 'Rôles', value: roles, inline: false } 
            )
            .setFooter({ text: process.env.FOOTER })

        await interaction.reply({ ephemeral: true, embeds: [embed] });
    }
});

// --------------------------------------------------------------------------------------------------------------------------------



// Ignorer les messages des autres bots
client.on('messageCreate', (message) => {
    if (message.author.bot) return;
});

// Quand le bot est prêt
client.once('ready', () => {
    console.log(`Bot connecté en tant que ${client.user.tag}`);
});

// Connexion du bot
client.login(process.env.TOKEN);