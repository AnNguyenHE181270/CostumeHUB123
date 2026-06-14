import React, { useState, useEffect } from 'react';
import Input from './ui/Input';

export default function GHNAddressSelect({ 
    provinceId, districtId, wardCode, 
    onChange 
}) {
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    const [loadingP, setLoadingP] = useState(true);
    const [loadingD, setLoadingD] = useState(false);
    const [loadingW, setLoadingW] = useState(false);

    // Fetch Provinces
    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const res = await fetch('http://localhost:9999/api/ghn/provinces');
                const data = await res.json();
                if (res.ok) {
                    setProvinces(data);
                }
            } catch (error) {
                console.error("Failed to fetch GHN provinces", error);
            } finally {
                setLoadingP(false);
            }
        };
        fetchProvinces();
    }, []);

    // Fetch Districts
    useEffect(() => {
        if (!provinceId) {
            setDistricts([]);
            return;
        }
        const fetchDistricts = async () => {
            setLoadingD(true);
            try {
                const res = await fetch(`http://localhost:9999/api/ghn/districts?provinceId=${provinceId}`);
                const data = await res.json();
                if (res.ok) {
                    setDistricts(data);
                }
            } catch (error) {
                console.error("Failed to fetch GHN districts", error);
            } finally {
                setLoadingD(false);
            }
        };
        fetchDistricts();
    }, [provinceId]);

    // Fetch Wards
    useEffect(() => {
        if (!districtId) {
            setWards([]);
            return;
        }
        const fetchWards = async () => {
            setLoadingW(true);
            try {
                const res = await fetch(`http://localhost:9999/api/ghn/wards?districtId=${districtId}`);
                const data = await res.json();
                if (res.ok) {
                    setWards(data);
                }
            } catch (error) {
                console.error("Failed to fetch GHN wards", error);
            } finally {
                setLoadingW(false);
            }
        };
        fetchWards();
    }, [districtId]);

    const handleProvinceChange = (e) => {
        const id = e.target.value;
        const name = e.target.options[e.target.selectedIndex].text;
        onChange({
            provinceId: id ? Number(id) : null,
            province: id ? name : "",
            districtId: null,
            district: "",
            wardCode: "",
            ward: ""
        });
    };

    const handleDistrictChange = (e) => {
        const id = e.target.value;
        const name = e.target.options[e.target.selectedIndex].text;
        onChange({
            provinceId,
            province: provinces.find(p => p.ProvinceID === provinceId)?.ProvinceName || "",
            districtId: id ? Number(id) : null,
            district: id ? name : "",
            wardCode: "",
            ward: ""
        });
    };

    const handleWardChange = (e) => {
        const code = e.target.value;
        const name = e.target.options[e.target.selectedIndex].text;
        onChange({
            provinceId,
            province: provinces.find(p => p.ProvinceID === provinceId)?.ProvinceName || "",
            districtId,
            district: districts.find(d => d.DistrictID === districtId)?.DistrictName || "",
            wardCode: code,
            ward: code ? name : ""
        });
    };

    const selectClass = "w-full bg-surface border border-[#eaeaea] rounded-xl px-4 py-3 text-sm text-[#1a1a1a] outline-none transition-all duration-200 focus:border-[#1a1a1a] focus:bg-white focus:ring-1 focus:ring-[#1a1a1a]";

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Input label="Tỉnh / Thành phố">
                <select 
                    value={provinceId || ""} 
                    onChange={handleProvinceChange} 
                    className={selectClass} 
                    required
                >
                    <option value="" disabled>{loadingP ? "Đang tải..." : "Chọn tỉnh/thành"}</option>
                    {provinces.map(p => (
                        <option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>
                    ))}
                </select>
            </Input>
            <Input label="Quận / Huyện">
                <select 
                    value={districtId || ""} 
                    onChange={handleDistrictChange} 
                    className={selectClass} 
                    disabled={!provinceId}
                    required
                >
                    <option value="" disabled>{loadingD ? "Đang tải..." : "Chọn quận/huyện"}</option>
                    {districts.map(d => (
                        <option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</option>
                    ))}
                </select>
            </Input>
            <Input label="Phường / Xã">
                <select 
                    value={wardCode || ""} 
                    onChange={handleWardChange} 
                    className={selectClass} 
                    disabled={!districtId}
                    required
                >
                    <option value="" disabled>{loadingW ? "Đang tải..." : "Chọn phường/xã"}</option>
                    {wards.map(w => (
                        <option key={w.WardCode} value={w.WardCode}>{w.WardName}</option>
                    ))}
                </select>
            </Input>
        </div>
    );
}
