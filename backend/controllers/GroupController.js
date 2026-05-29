const GroupDAO = require("../DAOs/GroupDAO");

class GroupController {
  //  CREATE GROUP
  async createGroup(req, res) {
    try {
      const { name, members } = req.body;

      console.log("Creating group with data:", { name, members });

      if (!name || !Array.isArray(members) || members.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid group data",
        });
      }

      const groupId = await GroupDAO.createGroup({
        name,
        members,
      });

      return res.status(201).json({
        success: true,
        message: "Group created successfully",
        groupId,
      });
    } catch (error) {
      console.error("CREATE GROUP ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to create group",
      });
    }
  }

  //  GET USER GROUPS
  async getUserGroups(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      const groups = await GroupDAO.getUserGroups(userId);

      return res.status(200).json({
        success: true,
        data: {
          groups: groups.map((group) => ({
            id: group.id,
            name: group.name,
          })),
        },
      });
    } catch (error) {
      console.error("GET USER GROUPS ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch groups",
      });
    }
  }

  //  GET GROUP BY ID
  async getGroupById(req, res) {
    try {
      const { groupId } = req.params;

      const group = await GroupDAO.getGroupById(groupId);

      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Group not found",
        });
      }

      return res.status(200).json({
        success: true,
        group,
      });
    } catch (error) {
      console.error("GET GROUP ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch group",
      });
    }
  }

  //  UPDATE GROUP
  async updateGroup(req, res) {
    try {
      const { groupId } = req.params;
      const updateData = req.body;

      await GroupDAO.updateGroup(groupId, updateData);

      return res.status(200).json({
        success: true,
        message: "Group updated successfully",
      });
    } catch (error) {
      console.error("UPDATE GROUP ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to update group",
      });
    }
  }

  //  DELETE GROUP
  async deleteGroup(req, res) {
    try {
      const { groupId } = req.params;

      await GroupDAO.deleteGroup(groupId);

      return res.status(200).json({
        success: true,
        message: "Group deleted successfully",
      });
    } catch (error) {
      console.error("DELETE GROUP ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to delete group",
      });
    }
  }

  //  ADD MEMBER
  async addMember(req, res) {
    try {
      const { groupId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      await GroupDAO.addMember(groupId, userId);

      return res.status(200).json({
        success: true,
        message: "Member added successfully",
      });
    } catch (error) {
      console.error("ADD MEMBER ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to add member",
      });
    }
  }

  //  REMOVE MEMBER
  async removeMember(req, res) {
    try {
      const { groupId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      await GroupDAO.removeMember(groupId, userId);

      return res.status(200).json({
        success: true,
        message: "Member removed successfully",
      });
    } catch (error) {
      console.error("REMOVE MEMBER ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to remove member",
      });
    }
  }

  //  ADD TASK TO GROUP
  async addTaskToGroup(req, res) {
    try {
      const { groupId, groupName } = req.params;
      const { taskId } = req.body;

      if (!taskId) {
        return res.status(400).json({
          success: false,
          message: "Task ID is required",
        });
      }

      await GroupDAO.addTaskToGroup(groupId, taskId);

      return res.status(200).json({
        success: true,
        message: "Task added to group successfully",
      });
    } catch (error) {
      console.error("ADD TASK TO GROUP ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to add task to group",
      });
    }
  }
}

module.exports = new GroupController();
