/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
"attacker_character_id":"",
"attacker_fire_mode_id":"",
"attacker_loadout_id":"",
"attacker_vehicle_id":"",
"attacker_weapon_id":"",
"character_id":"",
"character_loadout_id":"",
"event_name":"VehicleDestroy",
"timestamp":"",
"vehicle_id":"",
"world_id":"",
"zone_id":""
 * ### END ###
 **/

module.exports = (sequelize, Sequelize) => {
    const VehicleDestroy = sequelize.define("VehicleDestroy", {
        timestamp: {
            type: Sequelize.BIGINT.UNSIGNED
        },
        attacker_character_id: {
            type: Sequelize.BIGINT.UNSIGNED
        },
        attacker_fire_mode_id: {
            type: Sequelize.SMALLINT.UNSIGNED
        },
        attacker_loadout_id: {
            type: Sequelize.TINYINT.UNSIGNED
        },
        attacker_vehicle_id: {
            type: Sequelize.SMALLINT.UNSIGNED
        },
        attacker_weapon_id: {
            type: Sequelize.MEDIUMINT.UNSIGNED
        },
        character_id: {
            type: Sequelize.BIGINT.UNSIGNED
        },
        character_loadout_id: {
            type: Sequelize.TINYINT.UNSIGNED
        },
        event_name: {
            type: Sequelize.STRING
        },
        is_critical: {
            type: Sequelize.BOOLEAN
        },
        is_headshot: {
            type: Sequelize.BOOLEAN
        },
        vehicle_id: {
            type: Sequelize.SMALLINT.UNSIGNED
        },
        world_id: {
            type: Sequelize.SMALLINT.UNSIGNED
        },
        zone_ihd: {
            type: Sequelize.MEDIUMINT.UNSIGNED
        },
    });
  
    return VehicleDestroy;
  };
