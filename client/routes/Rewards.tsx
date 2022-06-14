import { Add, Delete } from "@mui/icons-material"
import {
  Button,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
} from "@mui/material"
import { Reward } from "@prisma/client"
import React from "react"
import { Link } from "react-router-dom"
import { useApi } from "../hooks/useApi"

export const Rewards: React.FC = () => {
  const rewards = useApi<Reward[]>("/rewards")

  return (
    <div>
      <List>
        {rewards.map((x, i) => (
          <ListItemButton key={i} component={Link} to={x.id}>
            <ListItemText primary={x.name} />
          </ListItemButton>
        ))}
      </List>
      <Button startIcon={<Add />} component={Link} to="add">
        추가하기
      </Button>
    </div>
  )
}
