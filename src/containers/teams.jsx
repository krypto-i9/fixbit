import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { DEBUG_PRINT } from "../components/debugTools";
import { httpReq } from "../components/httpRequest";
import { getToken } from "../reducers/tokenTracker";
import TeamCard from "./team-card";
import noTeamsImage from "../images/no-teams.png";
import { Backdrop, CircularProgress, Fab, makeStyles } from "@material-ui/core";
import { GroupWorkRounded } from "@material-ui/icons";
import TeamDialog from "./team-dialog";
import config from "../components/config.json";
import { NOTIFY, AlertDialog, snackPosition } from "../components/notify";
import { useSnackbar } from "notistack";
import { Info, InfoSubtitle } from "@mui-treasury/components/info";
import { useApexInfoStyles } from "@mui-treasury/styles/info/apex";

const useStyles = makeStyles((theme) => ({
  backdrop: {
    zIndex: theme.zIndex.drawer + 200,
    color: theme.palette.primary.main,
  },
  fab: {
    display: "flex",
    position: "fixed",
    zIndex: theme.zIndex.drawer - 1,
    bottom: theme.spacing(3),
    right: theme.spacing(2),
    transition: "0.2s",
    "&:before": {
      transition: "0.3s",
    },
  },
  extendedIcon: {
    marginRight: theme.spacing(1),
  },
  fabText: {
    display: "flex",
  },
  fabTextHidden: {
    display: "none",
  },
  noTeamsImage: {
    width: "auto",
    [theme.breakpoints.down("sm")]: {
      width: "100%",
    },
  },
  mainViewNoData: {
    display: "auto",
    marginLeft: "3%",
  },
  mainViewWithData: {
    display: "auto",
    marginLeft: "3%",
    float: "left",
  },
}));

const Teams = () => {
  const classes = useStyles();
  const token = useSelector(getToken);

  const [isLoaded, setIsLoaded] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [data, setData] = React.useState([]);
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertType, setAlertType] = React.useState(null);
  const [alertTitle, setAlertTitle] = React.useState(null);
  const [alertMsg, setAlertMsg] = React.useState(null);
  const [fabType, setFabType] = React.useState("round");

  const [_openBackdrop, _setOpenBackdrop] = React.useState(false);

  const [open, setOpen] = React.useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleAlertClose = () => setAlertOpen(false);

  const handleOpenBackdrop = () => _setOpenBackdrop(true);
  const handleCloseBackdrop = () => _setOpenBackdrop(false);

  const extendFAB = () => setFabType("extended");
  const roundFAB = () => setFabType("round");

  const { enqueueSnackbar } = useSnackbar();

  const fetchDataAndSet = () => {
    httpReq(`${config.URL}/api/teams`, "GET", null, token)
      .then((res) => {
        DEBUG_PRINT(res);
        res.json().then((r) => {
          NOTIFY(r.msg, (msg) => {
            _setOpenBackdrop(false);
            if (msg === null || msg === undefined) msg = r.message;
            if (
              r.type !== "info" ||
              localStorage.getItem("disp_info_snacks") === "true"
            )
              enqueueSnackbar(msg, {
                variant: r.type,
                anchorOrigin: snackPosition(),
              });
            DEBUG_PRINT(r);
            if (res.status === 200 && r.success === true)
              r.data !== null ? setData(r.data) : setData([]);
            else setError(r.msg);
            setIsLoaded(true);
          });
        });
      })
      .catch((err) => {
        setAlertType("error");
        const parsedError = err.toString().split(":");
        if (parsedError.length >= 1) {
          setAlertTitle(parsedError[0].trim());
        } else {
          setAlertTitle("Error");
        }
        if (parsedError.length >= 2) {
          setAlertMsg(parsedError[1].trim());
        } else {
          setAlertMsg("Unknown");
        }
        setAlertOpen(true);
        setError(err.toString());
        setIsLoaded(true);
      });
    handleClose();
  };

  useEffect(() => {
    fetchDataAndSet();
  }, []);

  if (error) {
    return (
      <div style={{ margin: "0 auto", width: "300px" }}>
        <h1>{error}</h1>
      </div>
    );
  } else if (!isLoaded)
    return (
      <div>
        <Backdrop className={classes.backdrop} open="true">
          <CircularProgress color="inherit" />
        </Backdrop>
      </div>
    );
  return (
    <div>
      <Backdrop className={classes.backdrop} open={_openBackdrop}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <AlertDialog
        alertOpen={alertOpen}
        title={alertTitle}
        type={alertType}
        msg={alertMsg}
        handleAlertClose={() => handleAlertClose()}
      />
      <Fab
        variant={fabType}
        className={classes.fab}
        color="primary"
        onClick={handleOpen}
        onMouseEnter={extendFAB}
        onMouseLeave={roundFAB}
      >
        <GroupWorkRounded
          className={fabType === "extended" ? classes.extendedIcon : null}
        />
        <div
          className={
            fabType === "extended" ? classes.fabText : classes.fabTextHidden
          }
        >
          New Team
        </div>
      </Fab>
      <TeamDialog
        open={open}
        handleClose={() => handleClose()}
        openBackdrop={() => handleOpenBackdrop()}
        closeBackdrop={() => handleCloseBackdrop()}
        action={() => fetchDataAndSet()}
      />
      <div
        className={
          data.length === 0 ? classes.mainViewNoData : classes.mainViewWithData
        }
      >
        {data.length === 0 ? (
          <div style={{ textAlign: "center", maxWidth: "100%" }}>
            <img
              className={classes.noTeamsImage}
              src={noTeamsImage}
              alt="No Teams"
            />
            <h3>NO TEAMS YET</h3>
            <Info useStyles={useApexInfoStyles}>
              <InfoSubtitle className={classes.textDesc}>
                click&ensp;
                <GroupWorkRounded style={{ position: "relative", top: 7 }} />
                &ensp;to create your first team.
              </InfoSubtitle>
            </Info>
          </div>
        ) : (
          data.map((value, index) => (
            <TeamCard
              key={index}
              data={value}
              openBackdrop={() => handleOpenBackdrop()}
              closeBackdrop={() => handleCloseBackdrop()}
              refetchData={() => fetchDataAndSet()}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Teams;
