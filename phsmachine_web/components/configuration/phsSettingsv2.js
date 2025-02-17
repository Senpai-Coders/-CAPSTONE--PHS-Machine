import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Loading from "../loading";

import {
  RebootConfirm,
  ShutdownConfirm,
  ResetConfirm,
  UpdateConfirm,
} from "../modals";

import axios from "axios";

import { VscDebugConsole } from "react-icons/vsc";

import { FiHardDrive, FiZapOff, FiRefreshCcw } from "react-icons/fi";
import { MdAutoDelete } from "react-icons/md";
import { IoMdGitMerge } from "react-icons/io";
import { AiFillGithub ,AiOutlineSearch , AiOutlineLoading} from "react-icons/ai";
import { BiNetworkChart, BiReset } from "react-icons/bi";
import { BsGear, BsLayoutThreeColumns } from "react-icons/bs";
import { TiWarningOutline } from "react-icons/ti";
import { SiWeightsandbiases } from "react-icons/si";
import { RiTempColdFill } from "react-icons/ri";
import { FaStopCircle } from "react-icons/fa";
import { BsBootstrapReboot } from "react-icons/bs";

import {
  bytesToMegaBytes,
  mbToGB,
  getPercentUsage,
  PI_IP,
  getMyData,
} from "../../helpers";

import { toast } from "react-toastify";

const phsSettings = ({
  autoDelete,
  state,
  identity,
  aimodels,
  detectionMode,
  storageInfo,
  divisionCount,
  fireOnChange,
}) => {
  const router = useRouter();
  const [selectedModal, setSelectedModal] = useState(-1);
  const [tempThresh, setTempThresh] = useState(
    detectionMode.value.temperatureThreshold
  );

  const [loadingupdate, setLoadingUpdate] = useState(false);

  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [updating, setUpdating] = useState("");

  const [used, setUsed] = useState(0);
  const [free, setFree] = useState(0);
  const [size, setSize] = useState(0);
  const [perc, setPerc] = useState(0);

  const [userData, setUserData] = useState();
  const [canEdit, setCanEdit] = useState(false);

  const [divCol, setDivCol] = useState(1);
  const [divRow, setDivRow] = useState(1);

  const [PHS_NAME, setPHS_NAME] = useState("");

  const [availableUps, setAvailableUps] = useState("-");

  useEffect(() => {
    fetch(`/api/phs/phsUpdate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: 0,
      }),
    })
      .then((response) => response.json())
      .then((res) => {
        setAvailableUps(res.update);
      })
      .catch(function (error) {});
  }, []);

  useEffect(() => {
    if (hasChanges) return;
    setDivCol(divisionCount.col);
    setDivRow(divisionCount.row);
  }, [divisionCount]);

  useEffect(() => {
    let Size = mbToGB(bytesToMegaBytes(storageInfo.size)),
      Free = mbToGB(bytesToMegaBytes(storageInfo.free)),
      Used = Size - Free;
    setSize(Size.toFixed(1));
    setFree(Free.toFixed(1));
    setUsed(Used.toFixed(1));
    setPerc(getPercentUsage(Size, Used));
  }, [storageInfo]);

  useEffect(() => {
    setPHS_NAME(identity.value.server_name);
  }, [identity]);

  const getUserData = async () => {
    const usrData = await getMyData();
    setUserData(usrData);
    setCanEdit(usrData.role > 1);
  };

  const updatePhsName = async () => {
    try {
      const phs_identity = await axios.post("/api/phs/config/aimodels", {
        mode: 1,
        search: {
          category: "config",
          config_name: "identity",
        },
        changes: {
          value: {
            ...identity.value,
            server_name: PHS_NAME,
          },
        },
      });
      toast.success("Done", { position: toast.POSITION.BOTTOM_RIGHT });
      location.reload();
    } catch (e) {
      toast.error("failed", { position: toast.POSITION.BOTTOM_RIGHT });
    }
  };

  useEffect(() => {
    getUserData();
  }, []);

  const updateAutoDelete = async () => {
    try {
      setUpdating("autodelete");
      let updateAutoDelete = await axios.post(
        "/api/phs/config/storageAutoDelete",
        { mode: 1, value: !autoDelete.value }
      );
      toast.success("Done", { position: toast.POSITION.BOTTOM_RIGHT });
    } catch (e) {
      toast.error("Failed", { position: toast.POSITION.BOTTOM_RIGHT });
    }
    fireOnChange();
  };

  const updateDivision = async () => {
    try {
      setUpdating("division");
      const ph_division = await axios.post("/api/phs/config/divisions", {
        mode: 1,
        value: {
          col: divCol,
          row: divRow,
        },
      });
      setHasChanges(false);
      fireOnChange();
      toast.success("Done", { position: toast.POSITION.BOTTOM_RIGHT });
    } catch (e) {
      toast.error("failed", { position: toast.POSITION.BOTTOM_RIGHT });
    }
  };

  useEffect(() => {
    setUpdating("");
  }, [autoDelete, storageInfo, detectionMode, divisionCount]);

  const saveChange = async (val) => {
    try {
      setSaving(true);
      setUpdating("autodetect");

      if (val) {
        const updateDetMode = await axios.post(
          "/api/phs/config/detectionMode",
          {
            mode: 1,
            value: {
              mode: val,
              temperatureThreshold: tempThresh,
            },
          }
        );
      } else {
        const updateDetMode = await axios.post(
          "/api/phs/config/detectionMode",
          {
            mode: 1,
            value: {
              mode: false,
              temperatureThreshold: tempThresh,
            },
          }
        );
      }

      toast.success("Done", { position: toast.POSITION.BOTTOM_RIGHT });
      setHasChanges(false);
      setSaving(false);
      fireOnChange();
    } catch (e) {
      toast.success("Failed", { position: toast.POSITION.BOTTOM_RIGHT });
      console.log(e);
    }
  };

  useEffect(() => {
    if (hasChanges) return;
    setTempThresh(detectionMode.value.temperatureThreshold);
  }, [detectionMode]);

  const chooseState = async (state) => {
    try {
      const updateState = await axios.get(
        `http://${PI_IP}:8000/updateState?status=${state}`
      );
      toast.success("Done", { position: toast.POSITION.BOTTOM_RIGHT });
      fireOnChange();
    } catch (e) {
      toast.error("Failed", { position: toast.POSITION.BOTTOM_RIGHT });
    }
  };

  const setModel = async (newValue) => {
    try {
      const updatePhsModel = await axios.post("/api/phs/config/aimodels", {
        mode: 1,
        search: { config_name: "identity" },
        changes: newValue,
      });
      toast.success("Done", { position: toast.POSITION.BOTTOM_RIGHT });
    } catch (e) {
      toast.error("Failed", { position: toast.POSITION.BOTTOM_RIGHT });
    }
    await fireOnChange();
    toast.info("Restart is required for the changes to take effect", {
      position: toast.POSITION.BOTTOM_RIGHT,
    });
  };

  const checkupdate = async () => {
    try {
      setLoadingUpdate(true)
      const fetchupdate = await axios.post("/api/phs/phsUpdate", { mode: 2 });
      const getupdate = await axios.post("/api/phs/phsUpdate", { mode: 0 });
      setAvailableUps(getupdate.data.update);
    } catch (e) {
      console.log(e);
    }finally{
        setLoadingUpdate(false)
    }
  };

  return (
    <div className="">
      <ShutdownConfirm
        shown={selectedModal === -2}
        onAccept={() => {
          router.push("/shutdown");
          axios.post("/api/phs/config/power", { mode: 0 });
        }}
        close={() => {
          setSelectedModal(-1);
        }}
      />

      <RebootConfirm
        shown={selectedModal === -3}
        onAccept={() => {
          router.push("/reboot");
          axios.post("/api/phs/config/power", { mode: 1 });
        }}
        close={() => {
          setSelectedModal(-1);
        }}
      />

      <ResetConfirm
        shown={selectedModal === -4}
        onAccept={() => {}}
        close={() => {
          setSelectedModal(-1);
        }}
      />

      <UpdateConfirm
        shown={selectedModal === 1}
        onAccept={() => {
          router.push("/update");
          const response = axios.get(
            `http://${PI_IP}:8000/shutdown_reboot?tostate=updating`
          );
          axios.post("/api/phs/phsUpdate", { mode: 1 });
        }}
        close={() => {
          setSelectedModal(-1);
        }}
      />

      {state === -2 && (
        <div className="alert alert-warning shadow-lg my-4 animate-pulse">
          <div className="">
            <TiWarningOutline className="hidden sm:block h-4 w-4" />
            <span>
              You cannot update some configuration because the core system is
              off
            </span>
          </div>
        </div>
      )}

      <div className="mt-4 mx-1 md:mx-2 rounded-md p-4 md:p-4 outline  bg-base-100 shadow-sm outline-1 outline-base-300">
        {/** Simple Control & Status */}
        <div className="flex justify-between items-center">
          <p className="font-inter font-medium mb-2 text-lg md:text-xl">
            System
          </p>
          <button
            onClick={() => fireOnChange()}
            className="btn btn-sm btn-active "
          >
            Refresh <FiRefreshCcw className="ml-2" />
          </button>
        </div>

        <div className="form-control mt-2 md:mt-6">
          <div className="input-group">
            <input
              type="text"
              value={PHS_NAME}
              onChange={(e) => {
                // setSearchId(e.target.value);
                setPHS_NAME(e.target.value);
              }}
              placeholder="Set PHS Name"
              className="input w-full input-bordered"
            />
            <button
              onClickCapture={() => updatePhsName()}
              disabled={
                identity.value.server_name === PHS_NAME || PHS_NAME.length === 0
              }
              onClick={() => {}}
              className="btn "
            >
              Update
            </button>
          </div>
        </div>

        <div
          className={`grid grid-cols-1 w-full ${
            state === -2 || state === 3 ? "opacity-50" : ""
          }`}
        >
          <div className="mt-2 card ">
            <div className="card-body p-2">
              <div className="md:flex items-center justify-between">
                <div className="mr-4">
                  <div className="flex items-center justify-start mb-2">
                    <div className="p-2 rounded-xl bg-base-300 mr-2">
                      <VscDebugConsole className="w-6 h-6" />
                    </div>
                    <p className="text-lg"> Debug Mode</p>
                  </div>
                  <p className="text-xs md:text-sm">
                    This will disable detection & actions. You can also be able
                    to test the relays via{" "}
                  </p>
                  <div className="text-sm text-secondary breadcrumbs">
                    <ul>
                      <li>Settings</li>
                      <li>Relays</li>
                    </ul>
                  </div>
                </div>
                <input
                  type="checkbox"
                  onChange={(e) => {
                    chooseState(state == 2 ? 0 : 2);
                  }}
                  checked={state === 2}
                  disabled={state === -2 || state === 3}
                  className="toggle mt-4 md:mt-0"
                />
              </div>
            </div>
          </div>

          {/* <div className="mt-2 card">
            <div className="card-body p-2">
              <div className="md:flex items-center justify-between">
                <div className="mr-4">
                  <div className="flex items-center justify-start mb-2">
                    <div className="p-2 rounded-xl bg-base-300 mr-2">
                      <AiFillStop className="w-6 h-6" />
                    </div>
                    <p className="text-lg"> Disable PHS</p>
                  </div>
                  <p className="text-xs md:text-sm">
                    When disabled, the system cannot detect & will not do any
                    actions. You can also be able to toggle relays manually
                  </p>
                </div>
                <input
                  type="checkbox"
                  onChange={(e) => {
                    chooseState(state === -1 ? 0 : -1);
                  }}
                  checked={state === -1}
                  disabled={state === -2}
                  className="toggle mt-4 md:mt-0"
                />
              </div>
            </div>
          </div> */}

          <div className="mt-2 card">
            <div className="card-body p-2">
              <div className="md:flex items-center justify-between">
                <div className="mr-4">
                  <div className="flex items-center justify-start mb-2">
                    <div className="p-2 rounded-xl bg-base-300 mr-2">
                      {/* <AiFillStop className="w-6 h-6" /> */}
                    </div>
                    <p className="text-lg">Emergency Stop</p>
                  </div>
                  <p className="text-xs md:text-sm">
                    This will stop all ongoing actions and disable the system
                  </p>
                </div>
                <button
                  disabled={state === -1 || state === -2}
                  onClick={async () => {
                    if (state == -1) return;
                    try {
                      const updateState = await axios.get(
                        `http://${PI_IP}:8000/emergencyStop`
                      );
                      fireOnChange();
                    } catch (e) {
                      console.log("err ", e);
                    }
                  }}
                  className="btn btn-error btn-sm mt-4 md:mt-0"
                >
                  Stop
                </button>
              </div>
            </div>
          </div>

          <div className="mt-2 card">
            <div className="card-body p-2">
              <div className="md:flex items-center justify-between">
                <div className="mr-4">
                  <div className="flex items-center justify-start mb-2">
                    <div className="p-2 rounded-xl bg-base-300 mr-2">
                      {/* <AiFillStop className="w-6 h-6" /> */}
                    </div>
                    <p className="text-lg">Start System</p>
                  </div>
                  {state >= 0 ? (
                    <p className="text-xs md:text-sm">PHS running</p>
                  ) : (
                    <p className="text-xs md:text-sm">
                      Turn back PHS core to detecting state
                    </p>
                  )}
                </div>
                <button
                  disabled={state >= 0 || state === -2}
                  onClick={() => {
                    chooseState(3);
                  }}
                  className="btn btn-success btn-sm mt-4 md:mt-0"
                >
                  {state >= 0 ? "running" : "Start PHS"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="divider" />
        <div className="flex justify-evenly mt-4">
          <button
            onClick={async () => {
              if (state == -1) return;
              try {
                const updateState = await axios.get(
                  `http://${PI_IP}:8000/emergencyStop`
                );
                fireOnChange();
              } catch (e) {
                console.log("err ", e);
                fireOnChange();
              }
            }}
            disabled={state < 0 || state === 3}
            className="btn btn-warning my-1 w-1/3"
          >
            <FaStopCircle className="w-4 h-4 text-error mr-2" />
            Emergency Stop
          </button>
          <button
            onClick={() => setSelectedModal(-2)}
            className="btn my-1 btn-error w-1/3"
          >
            <FiZapOff className="w-4 h-4 mr-2" />
            Shutdown PHS
          </button>
          <button
            onClick={() => setSelectedModal(-3)}
            className="btn my-1 btn-active w-1/3"
          >
            <BsBootstrapReboot className="w-4 h-4 mr-2" />
            Reboot PHS
          </button>
        </div>

        <div className="divider" />
        <div className="mt-2">
          <p className="font-inter font-medium mb-2 text-lg md:text-xl">
            System Update
          </p>
          <p className="mt-2 text-xs">
            PHS must be connected to the internet in order to get available
            updates
          </p>
          { loadingupdate ? (
            <AiOutlineLoading className=" mx-auto animate-spin my-16" />
          ) : (
            <>
              {availableUps !== "-" ? (
                <div className="flex mt-2 duration-400 group ease-in-out hover:bg-neutral hover:text-neutral-content justify-evenly items-center shadow-md p-4">
                  <IoMdGitMerge className="text-4xl mr-2" />
                  <div className="">
                    <p className="font-bold mt-1">New Update Available</p>
                    <p className="mt-2 text-sm">{availableUps}</p>
                    <div className=" mt-4 flex flex-wrap space-x-2 items-center text-xs ">
                      <p className="font-medium">From </p>
                      <span>
                        <AiFillGithub />
                      </span>
                      <a
                        className="link font-medium"
                        href="https://github.com/Senpai-Coders/CAPSTONE-PHS-Machine"
                      >
                        https://github.com/Senpai-Coders/CAPSTONE-PHS-Machine
                      </a>
                    </div>
                  </div>
                  <div className="divider divider-horizontal"></div>
                  <button
                    onClick={() => {
                      setSelectedModal(1);
                    }}
                    className="p-4 hover:text-lg duration-500 hover:shadow-md ease-in-out hover:opacity-100 opacity-75 font-semibold"
                  >
                    Update
                  </button>
                </div>
              ) : (
                <p className="text-center w-full text-sm opacity-90 py-8">
                  No available update
                </p>
              )}
            </>
          )}
          <div
            className={"flex items-center justify-start text-sm mt-4 hover:opacity-80 duration-200 ease-in-out cursor-pointer " + + `${loadingupdate ? "animate-pulse" : " opacity-50"}` }
            onClick={() => {
                if(loadingupdate) return
              checkupdate();
            }}
          >
            {!loadingupdate && <AiOutlineSearch className={"mr-2" }/> } <p>{loadingupdate ? "getting updates..." : "Check for new update"}</p>
          </div>
        </div>
      </div>

      <div className="mx-1 md:mx-2 rounded-md p-4 md:p-4 outline mt-4 bg-base-100 shadow-sm outline-1 outline-base-300">
        {updating === "autodetect" && <Loading />}
        <p className="font-inter font-medium mb-2 text-lg md:text-xl">
          Heat Stress Detection
        </p>
        <div className="">
          <div className=" md:flex items-center justify-between">
            <div className="mr-4">
              <div className="flex items-center justify-start mb-2">
                <div className="p-2 rounded-xl bg-base-300 mr-2">
                  <BiNetworkChart className="w-6 h-6" />
                </div>
                <p className="text-lg">Automatic Detection</p>
              </div>
              <p className="text-xs md:text-sm">
                Let PHS AI identify Heatstressed pig automatically.
              </p>
            </div>
            <input
              type="checkbox"
              className="toggle mt-4 md:mt-0"
              onChange={(e) => {
                saveChange(e.target.checked);
              }}
              checked={detectionMode.value.mode}
            />
          </div>

          {!detectionMode.value.mode && (
            <>
              <div className="divider"></div>
              <div className="">
                <div className="mr-4">
                  <div className="flex items-center justify-start mb-2">
                    <div className="p-2 rounded-xl bg-base-300 mr-2">
                      <BsGear className="w-6 h-6" />
                    </div>
                    <p className="text-lg">Manual Detection</p>
                  </div>
                  <p className="text-xs md:text-sm">
                    When Automatic Detection is disabled, manual detection will
                    be used & the threshold temperature will be the basis for
                    identifying heatstress
                  </p>
                </div>
                <div>
                  <div className="mb-4 flex items-center">
                    <p className="mr-2">Temperature Heat Stress Threshold</p>
                  </div>
                  <div className="md:flex md:items-center">
                    {/* <p className="p-2 w-1/12 font-mono text-3xl bg-neutral rounded-box text-neutral-content mr-2">
                    {tempThresh}°C 
                </p> */}
                    <div className="form-control drop-shadow-lg mr-3">
                      <label className="input-group input-group-sm">
                        <input
                          type="number"
                          onChange={(e) => {
                            if (isNaN(Number.parseFloat(e.target.value)))
                              return;
                            setHasChanges(true);
                            setTempThresh(Number.parseFloat(e.target.value));
                          }}
                          placeholder="Enter Temperature °C"
                          value={tempThresh}
                          className="input w-full text-2xl font-mono max-w-xs text-neutral-content bg-neutral "
                        />
                        <span className="text-3xl">°C</span>
                      </label>
                    </div>

                    <input
                      type="range"
                      min="0"
                      step="0.1"
                      max="100"
                      value={tempThresh}
                      onChange={(e) => {
                        setTempThresh(e.target.value);
                        setHasChanges(true);
                      }}
                      className="drop-shadow-lg mt-6 md:mt-0 w-full md:w-11/12 range range-sm"
                    />
                  </div>
                </div>
                {tempThresh !== detectionMode.value.temperatureThreshold && (
                  <div className="btn-group mt-4">
                    <button
                      onClick={() => {
                        saveChange();
                      }}
                      className={`btn ${saving ? "loading" : ""}`}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        if (!saving)
                          setTempThresh(
                            detectionMode.value.temperatureThreshold
                          );
                      }}
                      className="btn"
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mx-1 md:mx-2 overflow-visible rounded-md p-4 md:p-4 outline mt-4 bg-base-100 shadow-sm outline-1 outline-base-300">
        {updating === "storage" || (updating === "division" && <Loading />)}
        <p className="font-inter font-medium mb-2 text-lg md:text-xl">
          PHS Advance Settings
        </p>

        <div className="mt-4">
          <div className="flex items-center justify-start mb-2">
            <div className="p-2 rounded-xl bg-base-300 mr-2">
              <BsLayoutThreeColumns className="w-6 h-6" />
            </div>
            <p className="text-lg">PHS FOV event area division</p>
          </div>

          <p className="text-sm">
            Specify subdivision of PHS FOV on which different action must take
            place in specific event(s).
          </p>

          <div className="md:flex items-center">
            <div>
              <div className="form-control drop-shadow-lg mt-2 mr-2">
                <label className="text-sm my-1">Column : Choose 1 - 12</label>
                <input
                  type="number"
                  onChange={(e) => {
                    var val = e.target.value;

                    if (`${val}`.length === 0) {
                      setDivCol("");
                      return;
                    }

                    if (val > 12) return;
                    if (val <= 0) return;
                    if (divCol !== val) setHasChanges(true);

                    setDivCol(Number.parseInt(val));
                  }}
                  placeholder="# of col"
                  value={divCol}
                  className="input w-full text-lg font-mono max-w-xs text-neutral-content bg-neutral "
                />
              </div>
            </div>

            <div>
              <div className="form-control drop-shadow-lg mt-2">
                <label className="text-sm my-1">Row : Choose 1 - 5</label>
                <input
                  type="number"
                  onChange={(e) => {
                    var val = e.target.value;

                    if (`${val}`.length === 0) {
                      setDivRow("");
                      return;
                    }

                    if (val > 5) return;
                    if (val <= 0) return;
                    if (divRow !== val) setHasChanges(true);

                    setDivRow(Number.parseInt(val));
                  }}
                  placeholder="# of row"
                  value={divRow}
                  className="input w-full text-lg font-mono max-w-xs text-neutral-content bg-neutral "
                />
              </div>
            </div>
          </div>

          <p className="text-sm mt-4">
            Bellow shows the visualization where the phs actions will take place
          </p>

          <div className="relative mt-4">
            <div
              className="w-full coverStretch bg-no-repeat h-80 bg-base-100"
              style={{
                backgroundImage: `url("http://${PI_IP}:8000/normal_feed")`,
              }}
            ></div>
            <div
              className={`w-full h-full grid grid-cols-${divCol} grid-rows-${divRow} overflow-hidden overflow-x-scroll absolute top-0 left-0`}
            >
              {
                // filter((e) => e !== data.value.eventLocation )
                Array.from({ length: divCol * divRow }, (_, i) => i + 1).map(
                  (e, idx) => (
                    <div
                      key={idx}
                      className="w-full p-4 outline outline-1 bg-base-100/70 hover:bg-base-100/95  outline-base-300 rounded-sm"
                    >
                      <p className="text-center text-sm">{e}</p>
                    </div>
                  )
                )
              }
            </div>
          </div>

          <span
            onClick={() => {
              updateDivision();
            }}
            className={`btn mt-4 btn-block ${
              (divCol !== "" && divCol !== divisionCount.col) ||
              (divRow !== "" && divRow !== divisionCount.row)
                ? ""
                : "hidden"
            }`}
          >
            Save
          </span>
        </div>

        <div className="divider"></div>

        <div className="mt-2 card ">
          <div className="card-body p-2">
            <div className="md:flex items-center justify-between">
              <div className="mr-4">
                <div className="flex items-center justify-start mb-2">
                  <div className="p-2 rounded-xl bg-base-300 mr-2">
                    <SiWeightsandbiases className="w-6 h-6" />
                  </div>
                  <p className="text-lg">YoloV5 Weights</p>
                </div>
                <p className="text-xs md:text-sm">
                  PHS use Yolov5 for identifying pigs. Weights contains weight &
                  bias that makes Yolov5 identified pigs. You can switch between
                  available weights below.
                </p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto mt-2">
            <table className="table w-full">
              <thead>
                <tr>
                  {/* <th></th> */}
                  <th>Weight Name</th>
                  {/* <th>Path</th> */}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {identity &&
                  aimodels &&
                  aimodels
                    .filter((mods) => mods.value.for === "yolo")
                    .map((mods, idx) => (
                      <tr
                        className={`${
                          identity.value.Yolo_Weights.name === mods.value.name
                            ? "active"
                            : ""
                        }`}
                        key={idx}
                      >
                        {/* <th>{idx + 1}</th> */}
                        <td>{mods.value.name}</td>
                        {/* <td>{mods.value.path}</td> */}
                        <td>
                          <button
                            onClick={() => {
                              setModel({
                                value: {
                                  ...identity.value,
                                  Yolo_Weights: {
                                    ...mods.value,
                                  },
                                },
                              });
                            }}
                            disabled={
                              identity.value.Yolo_Weights.name ===
                              mods.value.name
                            }
                            className={`btn btn-sm  ${
                              identity.value.Yolo_Weights.name ===
                              mods.value.name
                                ? "btn-accent btn-ghost btn-outline"
                                : ""
                            }`}
                          >
                            {" "}
                            {identity.value.Yolo_Weights.name ===
                            mods.value.name
                              ? "using"
                              : "set"}{" "}
                          </button>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          <div className="divider"></div>

          <div className="card-body p-2">
            <div className="md:flex items-center justify-between">
              <div className="mr-4">
                <div className="flex items-center justify-start mb-2">
                  <div className="p-2 rounded-xl bg-base-300 mr-2">
                    <RiTempColdFill className="w-6 h-6 text-error" />
                  </div>
                  <p className="text-lg">PHS Heatstress CNN weights</p>
                </div>
                <p className="text-xs md:text-sm">
                  PHS use custom made CNN model for identifying heatstress.
                  These weights contains the entire trained tensorflow CNN
                  model. You can switch between available weights below.
                </p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto mt-2">
            <table className="table w-full">
              <thead>
                <tr>
                  {/* <th></th> */}
                  <th>Weight Name</th>
                  {/* <th>Path</th> */}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {identity &&
                  aimodels &&
                  aimodels
                    .filter((mods) => mods.value.for === "heatstress")
                    .map((mods, idx) => (
                      <tr
                        className={`${
                          identity.value.Heat_Stress_Weights.name ===
                          mods.value.name
                            ? "active"
                            : ""
                        }`}
                        key={idx}
                      >
                        {/* <th>{idx + 1}</th> */}
                        <td>{mods.value.name}</td>
                        {/* <td className="truncate">{mods.value.path}</td> */}
                        <td>
                          <button
                            onClick={() => {
                              setModel({
                                value: {
                                  ...identity.value,
                                  Heat_Stress_Weights: {
                                    ...mods.value,
                                  },
                                },
                              });
                            }}
                            disabled={
                              identity.value.Heat_Stress_Weights.name ===
                              mods.value.name
                            }
                            className={`btn btn-sm  ${
                              identity.value.Heat_Stress_Weights.name ===
                              mods.value.name
                                ? "btn-accent btn-ghost btn-outline"
                                : ""
                            }`}
                          >
                            {" "}
                            {identity.value.Heat_Stress_Weights.name ===
                            mods.value.name
                              ? "using"
                              : "set"}{" "}
                          </button>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="divider"></div>

        <div className="flex items-center justify-start mb-2">
          <div className="p-2 rounded-xl bg-base-300 mr-2">
            <FiHardDrive className="w-6 h-6" />
          </div>
          <p className="text-lg">Storage</p>
        </div>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className="flex flex-col">
              <p className="">
                {used} GB used out of {size} Gb ({perc.toFixed(1)}%)
              </p>
            </div>
          </div>
        </div>

        <progress
          className="mx-2 progress progress-primary"
          value={used}
          max={size}
        ></progress>
        <p className="text-warning text-xs md:text-sm my-2">
          If the storage get's too small, PHS will stop saving detections & you
          must delete some detection records to free up storage space
        </p>

        <div className="mt-2 card ">
          <div className="card-body p-2">
            <div className="md:flex items-center justify-between">
              <div className="mr-4">
                <div className="flex items-center justify-start mb-2">
                  <div className="p-2 rounded-xl bg-base-300 mr-2">
                    <MdAutoDelete className="w-6 h-6" />
                  </div>
                  <p className="text-lg">Automatic Record Deletion</p>
                </div>
                <p className="text-xs md:text-sm">
                  Automatically delete older detection record if the used
                  storage exceed 95% of the systems total storage space in order
                  to store new records & prevent unexpected system malfunctions.
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoDelete.value}
                onChange={(e) => {
                  updateAutoDelete();
                }}
                className="toggle  mt-4 md:mt-0"
              />
            </div>
          </div>
        </div>
        {updating === "autodelete" && <Loading />}

        <div className="divider"></div>

        <div className="mt-2 card ">
          <div className="card-body p-2">
            <div className="md:flex items-center justify-between">
              <div className="mr-4">
                <div className="flex items-center justify-start mb-2">
                  <div className="p-2 rounded-xl bg-base-300 mr-2">
                    <BiReset className="w-6 h-6" />
                  </div>
                  <p className="text-lg">Hard Reset PHS</p>
                </div>
                <p className="text-xs md:text-sm">
                  Reset PHS to it's factory default state.
                </p>
              </div>
              <button
                disabled={!canEdit}
                onClick={() => setSelectedModal(-4)}
                className="btn mt-4 md:mt-0 btn-active btn-sm btn-ghost btn-outline btn-error"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default phsSettings;
